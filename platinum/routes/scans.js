var express = require('express');
var router = express.Router();
var AccountManager = require('./accountManager.js')
var accountManagerSingleton = AccountManager.singleton()


router.get('/accounts', function(req, res, next) {
  res.send({acct: accountManagerSingleton.accountMap, accts_running: accountManagerSingleton.activeAccounts});
});

module.exports = router;
