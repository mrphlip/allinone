#include "header.txt"

#include "version.h"
#include "maincomment.txt"

(function(){
	#include "getversion.in.js"

	#include "utils.in.js"

	#include "globals.in.js"

	#include "settingspane.in.js"

	#ifdef DEBUG
	#include "debug.in.js"

	#endif
	#include "fullon.in.js"

	#include "seekbar.in.js"

	#include "navbar.in.js"

	#include "mainline.in.js"
})();

#include "footer.txt"
