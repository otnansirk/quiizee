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

    // 1. Fetch attempt with retry for transient connection issues
    let attempt = null;
    for (let r = 0; r < 3; r++) {
      try {
        attempt = await db.query.quizAttempts.findFirst({
          where: eq(schema.quizAttempts.resultCode, resultCode),
        });
        if (attempt !== undefined) break;
      } catch (dbErr) {
        if (r === 2) throw dbErr;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    if (!attempt) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // 2. Fetch quiz with retry
    let quiz = null;
    for (let r = 0; r < 3; r++) {
      try {
        quiz = await db.query.quizzes.findFirst({
          where: eq(schema.quizzes.id, attempt.quizId),
        });
        if (quiz !== undefined) break;
      } catch (dbErr) {
        if (r === 2) throw dbErr;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // 3. Verify certificate eligibility
    if (attempt.status !== "graded" || !quiz.certificateEnabled) {
      const errorMsg = "Certificate is not available for this assessment attempt.";
      if (request.headers.get("accept")?.includes("text/html")) {
        return new NextResponse(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate Unavailable - Mini LMS</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #FAF9F6; color: #111827; font-family: Inter, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
    .card { background: #FFFFFF; border: 3px solid #111827; border-radius: 24px; padding: 3rem 2.5rem; max-width: 500px; width: 100%; text-align: center; box-shadow: 8px 8px 0px #111827; position: relative; }
    .badge { display: inline-block; background: #EF4444; color: #FFFFFF; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; padding: 0.35rem 0.85rem; border: 2px solid #111827; border-radius: 6px; margin-bottom: 1.5rem; box-shadow: 3px 3px 0px #111827; }
    .title { font-size: 2.2rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; color: #111827; margin: 0 0 1rem 0; line-height: 1.1; }
    .msg { color: #374151; font-size: 1rem; line-height: 1.6; font-weight: 600; margin-bottom: 2.5rem; }
    .btn { display: block; width: 100%; background: #4F46E5; color: #FFFFFF; padding: 1rem 1.5rem; border: 3px solid #111827; border-radius: 12px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 1rem; letter-spacing: 0.05em; box-shadow: 5px 5px 0px #111827; transition: transform 0.15s, box-shadow 0.15s; }
    .btn:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0px #111827; background: #4338CA; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">01 &nbsp;|&nbsp; Notice</div>
    <h1 class="title">Certificate<br/>Unavailable</h1>
    <div class="msg">${errorMsg}</div>
    <a href="/results/${encodeURIComponent(resultCode)}" class="btn">Return to Result Summary</a>
  </div>
</body>
</html>`,
          { status: 403, headers: { "Content-Type": "text/html" } }
        );
      }
      return NextResponse.json({ error: errorMsg }, { status: 403 });
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
    page.drawText("Verify online at QUIIZEE '26 Assessment Platform", {
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
  } catch (err: unknown) {
    console.error("Error generating PDF certificate:", err);
    let errorMessage = err instanceof Error && err.message ? err.message : "An unexpected database or system error occurred while generating your completion certificate.";
    if (
      errorMessage.toLowerCase().includes("select ") ||
      errorMessage.toLowerCase().includes("failed query") ||
      errorMessage.toLowerCase().includes("postgres") ||
      errorMessage.toLowerCase().includes("password authentication") ||
      errorMessage.toLowerCase().includes("syntax error")
    ) {
      errorMessage = "We encountered a temporary database connection issue while generating your completion certificate. Please try again in a few moments.";
    }
    const isHtml = request.headers.get("accept")?.includes("text/html");

    if (isHtml) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate Generation Error - Mini LMS</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #FAF9F6; color: #111827; font-family: Inter, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
    .card { background: #FFFFFF; border: 3px solid #111827; border-radius: 24px; padding: 3rem 2.5rem; max-width: 500px; width: 100%; text-align: center; box-shadow: 8px 8px 0px #111827; position: relative; }
    .badge { display: inline-block; background: #EF4444; color: #FFFFFF; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; padding: 0.35rem 0.85rem; border: 2px solid #111827; border-radius: 6px; margin-bottom: 1.5rem; box-shadow: 3px 3px 0px #111827; }
    .title { font-size: 2.2rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; color: #111827; margin: 0 0 1rem 0; line-height: 1.1; }
    .msg { color: #374151; font-size: 1rem; line-height: 1.6; font-weight: 600; margin-bottom: 2.5rem; word-break: break-word; }
    .btn { display: block; width: 100%; background: #4F46E5; color: #FFFFFF; padding: 1rem 1.5rem; border: 3px solid #111827; border-radius: 12px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 1rem; letter-spacing: 0.05em; box-shadow: 5px 5px 0px #111827; transition: transform 0.15s, box-shadow 0.15s; }
    .btn:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0px #111827; background: #4338CA; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">02 &nbsp;|&nbsp; Error</div>
    <h1 class="title">System<br/>Notice</h1>
    <div class="msg">${errorMessage}</div>
    <a href="/" class="btn">Return to Results</a>
  </div>
</body>
</html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
