// Podstar/Videlectrix (stock IIS), HRWiki and stock Apache error pages, respectively. Don't do anything on those pages.
if (document.title == "The page cannot be found" || document.title == "Homestar Runner Wiki - 404 Not Found" || document.title == "404 Not Found")
	return;
// We needed to add this pattern to the @match list in order to convince Chrome to let us do cross-site requests to here
// but we don't want to actually *run* on these pages.
if (location.href.match(/\/w\/index.php\?title=.*&action=raw&source=allinone/))
	return;

var utils = new Utils();
var globals = new Globals();
globals.initModules();
