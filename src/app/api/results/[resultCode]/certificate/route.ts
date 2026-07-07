import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultCode: string }> }
) {
  try {
    const resolvedParams = await params;
    const { resultCode } = resolvedParams;

    if (!resultCode) {
      return NextResponse.json({ error: "Result code is required" }, { status: 400 });
    }

    // 1. Fetch attempt
    const attempt = await db.query.quizAttempts.findFirst({
      where: eq(schema.quizAttempts.resultCode, resultCode),
    });

    if (!attempt) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // 2. Fetch quiz
    const quiz = await db.query.quizzes.findFirst({
      where: eq(schema.quizzes.id, attempt.quizId),
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // 3. Verify certificate eligibility
    if (attempt.status !== "graded" || !quiz.certificateEnabled) {
      return NextResponse.json(
        { error: "Certificate is not available for this assessment attempt." },
        { status: 403 }
      );
    }

    const totalScoreNum = Number(attempt.totalScore || 0);
    const maxScoreNum = Number(attempt.maxScore || 1);
    const percentage = Math.round((totalScoreNum / maxScoreNum) * 100);
    const minScoreThreshold = quiz.certificateMinScore || 0;

    if (percentage < minScoreThreshold) {
      return NextResponse.json(
        {
          error: `Minimum passing threshold of ${minScoreThreshold}% was not reached (scored ${percentage}%).`,
        },
        { status: 403 }
      );
    }

    // 4. Resolve Student Identity
    let studentName = "Student";
    if (attempt.userId) {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, attempt.userId),
      });
      if (user?.name) studentName = user.name;
    } else if (attempt.participantId) {
      const participant = await db.query.participants.findFirst({
        where: eq(schema.participants.id, attempt.participantId),
      });
      if (participant?.name) studentName = participant.name;
    }

    // 5. Resolve Instructor Identity
    let teacherName = "Instructor";
    const teacher = await db.query.users.findFirst({
      where: eq(schema.users.id, quiz.teacherId),
    });
    if (teacher?.name) teacherName = teacher.name;

    // 6. Format Completion Date
    const completionDateStr = attempt.endTime || attempt.updatedAt || attempt.startTime;
    const formattedDate = new Date(completionDateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 7. Generate Premium Landscape PDF Certificate with pdf-lib
    const pdfDoc = await PDFDocument.create();
    
    // A4 Landscape Dimensions: [841.89, 595.28]
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();

    // Embed Standard Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // --- Borders & Framing ---
    // Outer Indigo Border
    page.drawRectangle({
      x: 25,
      y: 25,
      width: width - 50,
      height: height - 50,
      borderColor: rgb(0.12, 0.12, 0.28), // Deep indigo/navy
      borderWidth: 4,
    });

    // Inner Gold/Amber Accent Border
    page.drawRectangle({
      x: 35,
      y: 35,
      width: width - 70,
      height: height - 70,
      borderColor: rgb(0.85, 0.65, 0.13), // Gold/Amber
      borderWidth: 1.5,
    });

    // --- Typography & Content ---
    // Header
    const titleText = "CERTIFICATE OF COMPLETION";
    const titleSize = 30;
    const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 120,
      size: titleSize,
      font: fontBold,
      color: rgb(0.12, 0.12, 0.28),
    });

    // Subtitle
    const subText = "This is to proudly certify that";
    const subSize = 16;
    const subWidth = fontOblique.widthOfTextAtSize(subText, subSize);
    page.drawText(subText, {
      x: (width - subWidth) / 2,
      y: height - 170,
      size: subSize,
      font: fontOblique,
      color: rgb(0.4, 0.4, 0.45),
    });

    // Student Name
    const nameSize = 36;
    const nameWidth = fontBold.widthOfTextAtSize(studentName, nameSize);
    const nameX = (width - nameWidth) / 2;
    page.drawText(studentName, {
      x: nameX,
      y: height - 235,
      size: nameSize,
      font: fontBold,
      color: rgb(0.39, 0.4, 0.95), // Vibrant Indigo
    });

    // Decorative Gold Underline below Name
    page.drawLine({
      start: { x: Math.max(nameX - 30, 80), y: height - 250 },
      end: { x: Math.min(nameX + nameWidth + 30, width - 80), y: height - 250 },
      thickness: 2,
      color: rgb(0.85, 0.65, 0.13),
    });

    // Achievement Description
    const achieveText = "has successfully demonstrated mastery and completed the assessment";
    const achieveSize = 15;
    const achieveWidth = fontRegular.widthOfTextAtSize(achieveText, achieveSize);
    page.drawText(achieveText, {
      x: (width - achieveWidth) / 2,
      y: height - 295,
      size: achieveSize,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.35),
    });

    // Quiz Title
    const quizSize = 24;
    const quizWidth = fontBold.widthOfTextAtSize(quiz.title, quizSize);
    page.drawText(quiz.title, {
      x: (width - quizWidth) / 2,
      y: height - 340,
      size: quizSize,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.25),
    });

    // Score & Accuracy Display
    const scoreText = `with an outstanding score of ${percentage}% (${totalScoreNum} / ${maxScoreNum} points)`;
    const scoreSize = 16;
    const scoreWidth = fontBold.widthOfTextAtSize(scoreText, scoreSize);
    page.drawText(scoreText, {
      x: (width - scoreWidth) / 2,
      y: height - 380,
      size: scoreSize,
      font: fontBold,
      color: rgb(0.13, 0.58, 0.32), // Emerald Green
    });

    // Awarded Date
    const dateText = `Awarded on ${formattedDate}`;
    const dateSize = 14;
    const dateWidth = fontOblique.widthOfTextAtSize(dateText, dateSize);
    page.drawText(dateText, {
      x: (width - dateWidth) / 2,
      y: height - 420,
      size: dateSize,
      font: fontOblique,
      color: rgb(0.45, 0.45, 0.5),
    });

    // --- Footer Blocks ---
    // Bottom Left: Verification Code
    page.drawText("VERIFICATION CODE:", {
      x: 75,
      y: 105,
      size: 10,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.45),
    });
    page.drawText(attempt.resultCode, {
      x: 75,
      y: 88,
      size: 14,
      font: fontBold,
      color: rgb(0.39, 0.4, 0.95),
    });
    page.drawText("Verify online at Mini LMS Platform", {
      x: 75,
      y: 72,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.55),
    });

    // Bottom Center: Official Seal Graphic
    const sealX = width / 2;
    const sealY = 95;
    page.drawCircle({
      x: sealX,
      y: sealY,
      size: 36,
      color: rgb(0.98, 0.92, 0.75),
      borderColor: rgb(0.85, 0.65, 0.13),
      borderWidth: 2,
    });
    page.drawCircle({
      x: sealX,
      y: sealY,
      size: 30,
      borderColor: rgb(0.85, 0.65, 0.13),
      borderWidth: 1,
    });
    const sealText1 = "OFFICIAL";
    const sealText2 = "CERTIFIED";
    const w1 = fontBold.widthOfTextAtSize(sealText1, 9);
    const w2 = fontBold.widthOfTextAtSize(sealText2, 9);
    page.drawText(sealText1, {
      x: sealX - w1 / 2,
      y: sealY + 4,
      size: 9,
      font: fontBold,
      color: rgb(0.6, 0.45, 0.05),
    });
    page.drawText(sealText2, {
      x: sealX - w2 / 2,
      y: sealY - 8,
      size: 9,
      font: fontBold,
      color: rgb(0.6, 0.45, 0.05),
    });

    // Bottom Right: Instructor Signature Block
    const sigLineStartX = width - 260;
    const sigLineEndX = width - 75;
    const sigCenter = (sigLineStartX + sigLineEndX) / 2;
    page.drawLine({
      start: { x: sigLineStartX, y: 105 },
      end: { x: sigLineEndX, y: 105 },
      thickness: 1,
      color: rgb(0.4, 0.4, 0.45),
    });

    const teacherWidth = fontBold.widthOfTextAtSize(teacherName, 13);
    page.drawText(teacherName, {
      x: sigCenter - teacherWidth / 2,
      y: 88,
      size: 13,
      font: fontBold,
      color: rgb(0.15, 0.15, 0.25),
    });

    const roleText = "Assessment Administrator";
    const roleWidth = fontRegular.widthOfTextAtSize(roleText, 10);
    page.drawText(roleText, {
      x: sigCenter - roleWidth / 2,
      y: 74,
      size: 10,
      font: fontRegular,
      color: rgb(0.45, 0.45, 0.5),
    });

    // 8. Serialize and Return PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Certificate-${attempt.resultCode}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Error generating PDF certificate:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the certificate." },
      { status: 500 }
    );
  }
}
