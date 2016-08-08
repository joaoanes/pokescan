var _ = require('underscore')


function AccountManager() {
	this.activeAccounts = 0
	this.accountMap = {
		"test, replace with your account name": { used: false, status: "healthy" }
	}
	return this
}

function getAccountInternal(self, ful)
{

	var accountKey = _.find(Object.keys(self.accountMap), (key)=> {return (!self.accountMap[key].used && (self.accountMap[key].status == "healthy" || self.accountMap[key].status == "flaky"))})
	if (accountKey)
	{

		if (self.activeAccounts <= 15)
		{
			self.accountMap[accountKey].used = true
			self.activeAccounts = self.activeAccounts + 1
			ful(accountKey)
			finished = finished + 1

			return
		}

	}

	setTimeout( () => {
		getAccountInternal(self, ful)
	}, 1500)
}

function releaseAccount(self, account, insucess)
{

	if (self.accountMap[account])
	{
		var accountObj = self.accountMap[account]
		if (insucess && (accountObj.status == "flaky"))
			accountObj.status = "dead"
		if (insucess && (accountObj.status == "healthy"))
			accountObj.status = "flaky"

		self.accountMap[account].used = false
		self.activeAccounts = self.activeAccounts - 1
	}

	if (_.find(Object.keys(self.accountMap), (key) => {return self.accountMap[key].status == "healthy" || self.accountMap[key].status == "flaky"}) == null)
	{

		console.log("AccountManager has no accounts, pardoning all")
		Object.keys(self.accountMap).forEach( (key) => {
			self.accountMap[key].status = "healthy"
		})
	}

}

var started = 0
var finished = 0

function getAccount(self)
{
	return new Promise((ful, rej) => {
		started = started + 1
		getAccountInternal(self, ful)
	}).catch( (e) => {console.log("errorseP:" + e)})
}

var singletonInstance
function singleton()
{
	if (singletonInstance == null)
		singletonInstance = new AccountManager()

	return singletonInstance
}

module.exports = {factory: AccountManager, singleton: singleton, getAccount: getAccount, getAccountInternal: getAccountInternal, releaseAccount: releaseAccount}
