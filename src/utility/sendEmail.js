import mailjet from 'node-mailjet';

const sendEmail = async (to, text, subject) => {
  const client = mailjet.apiConnect(
    process.env.MJ_API_KEY,
    process.env.MJ_API_SECRET
  );

  try {
    const response = await client
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.MJ_FROM_EMAIL,
              Name: 'Indexing Checker'
            },
            To: [
              {
                Email: to
              }
            ],
            Subject: subject,
            TextPart: text
          }
        ]
      });

    return response.body;
  } catch (error) {
    console.error('❌ Error sending email:', error?.response?.body || error.message);
    throw error;
  }
};

export default sendEmail;
