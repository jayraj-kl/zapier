import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, body:string) {
  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: to,
      subject: 'Hello from Zapier',
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              line-height: 1.6;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 10px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #777;
              margin-top: 20px;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #fff;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hello from Zapier</h1>
            </div>
            <p>Hi there,</p>
            <p>${body}</p>
            <a class="button" href="https://github.com/jayraj-kl">Visit ME</a>
            <p>Best regards,<br>Jayraj K. Ladkat</p>
          </div>
          <div class="footer">
            <p>GV96+PC8, Phadke Haud, Kasba Peth, Pune, Maharashtra 411002</p>
          </div>
        </body>
      </html>
            `,
    });

    console.log(data);
  } catch (error) {
    console.error(error);
  }
}