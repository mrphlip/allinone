// Podstar/Videlectrix (stock IIS), HRWiki and stock Apache error pages, respectively. Don't do anything on those pages.
if (document.title == "The page cannot be found" || document.title == "Homestar Runner Wiki - 404 Not Found" || document.title == "404 Not Found")
	return;

var utils = new Utils();
var globals = new Globals();
var playercomm = new PlayerComm();
playercomm.init();
await globals.initModules();
