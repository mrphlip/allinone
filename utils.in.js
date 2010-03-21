function Utils()
{
}
// Taken from http://diveintogreasemonkey.org/patterns/add-css.html
Utils.prototype.addGlobalStyle = function(css)
{
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) return;
	style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(document.createTextNode(css));
	head.appendChild(style);
}