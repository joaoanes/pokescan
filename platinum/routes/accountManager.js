var _ = require('underscore')


function AccountManager() {
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
		self.accountMap[accountKey].used = true
		ful(accountKey)

		return
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
	}

	if (_.find(Object.keys(self.accountMap), (key) => {return self.accountMap[key].status == "healthy" || self.accountMap[key].status == "flaky"}) == null)
	{

		console.log("AccountManager has no accounts, pardoning all")
		Object.keys(self.accountMap).forEach( (key) => {
			self.accountMap[key].status = "healthy"
		})
	}

}

function getAccount(self)
{


	return new Promise((ful, rej) => {

		getAccountInternal(self, ful)
	})
}

var singletonInstance
function singleton()
{
	if (singletonInstance == null)
		singletonInstance = new AccountManager()

	return singletonInstance
}

module.exports = {factory: AccountManager, singleton: singleton, getAccount: getAccount, getAccountInternal: getAccountInternal, releaseAccount: releaseAccount}
