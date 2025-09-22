module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(
    JSON.stringify({
      message: 'Hello from Vercel!',
      timestamp: new Date().toISOString()
    })
  );
};
