import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

export default class Config {
  static sendEmail(mailOptions) {
    const email = encodeURIComponent(functions.config().smtp.email);
    const password = encodeURIComponent(functions.config().smtp.password);
    const mailTransport = nodemailer.createTransport(
      `smtps://${email}:${password}@authsmtp.uchicago.edu`,
    );
    return new Promise(resolve => mailTransport.sendMail(mailOptions, resolve));
  }
}
