var _ = require('underscore')


function AccountManager() {
	this.accountMap = {

		"jfidgopr3": { used: false, status: "healthy" },
		"pokexpto3000": { used: false, status: "healthy" },
		"tetmsfog": { used: false, status: "healthy" },
		"hellomaotg34": { used: false, status: "healthy" },
		"franjascenas": { used: false, status: "healthy" },
		"pqpestamerda1": { used: false, status: "healthy" },
		"franjascenas1": { used: false, status: "healthy" },
		"satsohirre3": { used: false, status: "healthy" },
		"franjascenas2": { used: false, status: "healthy" },
		"hallomothh4443": { used: false, status: "healthy" },
		"pqpestamerda2": { used: false, status: "healthy" },
		"pqpestamerda3": { used: false, status: "healthy" },
		"FRANGOS1": { used: false, status: "healthy" },
		"satsith43352346": { used: false, status: "healthy" },
		"franjascenas4": { used: false, status: "healthy" },
		"pqpestamerda4": { used: false, status: "healthy" },
		"caligirl91284": { used: false, status: "healthy" },
		"poste300000": { used: false, status: "healthy" },
		"franjascenas5": { used: false, status: "healthy" },
		"FRANGOS2": { used: false, status: "healthy" },
		"pqpestamerda5": { used: false, status: "healthy" },
		"jewstrump2909": { used: false, status: "healthy" },
		"FRANGOS4": { used: false, status: "healthy" },
		"weee900487": { used: false, status: "healthy" },
		"pqpestamerda6": { used: false, status: "healthy" },
		"franjascenas6": { used: false, status: "healthy" },
		"orfuewt933": { used: false, status: "healthy" },
		"FRANGOS5": { used: false, status: "healthy" },
		"t438q9jnkgds": { used: false, status: "healthy" },
		"pqpestamerda7": { used: false, status: "healthy" },
		"franjascenas7": { used: false, status: "healthy" },
		"4wqthoet8yg4wer": { used: false, status: "healthy" },
		"pqpestamerda8": { used: false, status: "healthy" },
		"FRANGOS6": { used: false, status: "healthy" },
		"satoishg244": { used: false, status: "healthy" },
		"pqpestamerda9": { used: false, status: "healthy" },
		"pokesuper248i": { used: false, status: "healthy" },
		"FRANGOS7": { used: false, status: "healthy" },
		"franjascenas8": { used: false, status: "healthy" },
		"franjascenas9": { used: false, status: "healthy" },
		"vatilib": { used: false, status: "healthy" },
		"pqpestamerda10": { used: false, status: "healthy" },
		"FRANGOS8": { used: false, status: "healthy" },
		"fduckst5934u": { used: false, status: "healthy" },
		"pqpestamerda11": { used: false, status: "healthy" },
		"xoburon": { used: false, status: "healthy" },
		"FRANGOS9": { used: false, status: "healthy" },
		"pqpestamerda12": { used: false, status: "healthy" },
		"fazeclan3999": { used: false, status: "healthy" },
		"FRANGOS10": { used: false, status: "healthy" },
		"pqpestamerda13": { used: false, status: "healthy" },
		"franjascenas11": { used: false, status: "healthy" }
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
