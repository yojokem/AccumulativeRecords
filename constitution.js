module.exports = (app, express) => {
  app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
  app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
  app.use('/fonts', express.static(__dirname + "/public/fonts"));
  app.use('/styles', express.static(__dirname + "/public/styles"));
  app.use('/scripts', express.static(__dirname + "/public/scripts"));

  app.get("/theme", (req, res) => res.sendFile(__dirname + "/follows/theme_1601440531677.css"));
};
