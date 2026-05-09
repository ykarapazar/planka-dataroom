require('dotenv').config();
const nodemailer = require('nodemailer');

const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

t.sendMail({
  from: process.env.SMTP_FROM,
  to: 'ykarapazar@karapazarhukuk.com',
  subject: 'paydasdataroom — P1 SMTP smoke test',
  text:
    'If you receive this, Gmail SMTP via invest@getpaydas.com works.\n' +
    'You can delete this. Sent from kinetra-web at ' +
    new Date().toISOString(),
})
  .then((info) => {
    console.log('OK messageId=', info.messageId);
    console.log('response=', info.response);
    process.exit(0);
  })
  .catch((err) => {
    console.error('FAIL', err.code || '', err.message);
    process.exit(1);
  });
