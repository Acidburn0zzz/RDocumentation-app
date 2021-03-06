var axios = require('axios');

module.exports = {

  me: function(req, res) {
    var populateLimit = req._sails.config.blueprints.populateLimit;
    User.findOne({
      where: {
        id: req.user.id,
      },
      include: [
        { model: Example, as: 'examples', limit: populateLimit, include: [
          { model: Topic, as: 'topic', include:[
            {model: PackageVersion, as: 'package_version'},
          ]}
        ]},
      ]
    }).then(function(user) {
      if(user === null) return res.notFound();
      else return res.ok(user, 'user/show.ejs');
    }).catch(function(err) {
      return res.negotiate(err);
    });
  },

  create: function(req, res) {

    // First check the recaptcha
    var captchaResponse = req.body['g-recaptcha-response'];

    axios.post('https://www.google.com/recaptcha/api/siteverify',{}, {
      params: {
        secret: process.env.RECAPTCHA_SECRET,
        response: captchaResponse,
        remoteip: req.ip
      }
    }).then(function(response){
      if(response.data.success) {

        // Check if password and confirm_password are the same
        if(req.body.password !== req.body.confirm_password){
          FlashService.error(req, 'Passwords must match.');
          return res.rstudio_redirect(301,'/register');
        }
        var result = User.create(req.body);
        result.then(function(value) {
          passport.authenticate('local', { successRedirect: req.session['rdr'] || '/',
                                           failureRedirect: '/register',
                                           failureFlash: true })(req, res);
        }).catch(Sequelize.UniqueConstraintError, function (err) {
          FlashService.error(req, 'Username "' + req.body.username + '" has been taken.');
          return res.rstudio_redirect(301,'/register');
        }).catch(Sequelize.ValidationError, function (err) {
          err.errors.forEach(function(error){
            FlashService.error(req, error.message);
          });
          return res.rstudio_redirect(301,'/register');
        });

      } else {
        FlashService.error(req, 'Cannot verify recaptcha');
        return res.rstudio_redirect(301,'/register');
      }
    }).catch(function (error) {
      FlashService.error(req, 'Cannot verify recaptcha');
      return res.rstudio_redirect(301,'/register');
    });
  }

};
