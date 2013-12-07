#CPPOPTS=-x c++ -ftabstop=2 -P -CC -MD -MT built.user.js -MF built.user.js.d -MP
#built.user.js: Makefile
#	@# The perl script strips any leading blank lines that cpp likes to make...
#	@# the script has been carefully written to not explicitly use any variables, since
#	@# you can't seem to have a dollar sign in the script without make trying to expand it
#	cpp $(CPPOPTS) main.in.js | perl -e "while(<>){last if /\S/};print;print while (<>)" > built.user.js

REVISION=$(shell git log --oneline | wc -l)
DATE=$(shell date +%Y-%m-%d)
BUILDOPTS=-DREVISION=$(REVISION) -DBUILDDATE=$(DATE)

default: built.user.js built.crx

built.user.js: Makefile dobuild images.built.js
	./dobuild $(BUILDOPTS) master.in.js -o built.user.js -d built.user.js.d
debug.user.js: Makefile dobuild images.built.js
	./dobuild $(BUILDOPTS) -DDEBUG master.in.js -o debug.user.js -d debug.user.js.d
built.crx: Makefile buildmanifest built.user.js chrome/AllInOne/logo128.png
	./buildmanifest built.user.js > chrome/AllInOne/manifest.json
	cp built.user.js chrome/AllInOne/built.user.js
	google-chrome --pack-extension=chrome/AllInOne --pack-extension-key=chromekey.pem
	mv chrome/AllInOne.crx built.crx
debug.crx: Makefile buildmanifest debug.user.js chrome/AllInOne/logo128.png
	./buildmanifest debug.user.js > chrome/AllInOne/manifest.json
	cp debug.user.js chrome/AllInOne/debug.user.js
	google-chrome --pack-extension=chrome/AllInOne --pack-extension-key=chromekey.pem
	mv chrome/AllInOne.crx debug.crx


images.built.js: Makefile buildimages images/*.png
	./buildimages images/*.png > images.built.js

include built.user.js.d
include debug.user.js.d
built.user.js.d:
debug.user.js.d:

.PHONY: all clean debug build dist default
debug: debug.user.js debug.crx
	cp debug.user.js /home/phlip/.mozilla/firefox/ynorfbh1.default/gm_scripts/homestar_all-in-one/homestar_all-in-one.user.js
all: built.user.js built.crx debug.user.js debug.crx
clean:
	rm -f built.user.js built.user.js.d debug.user.js debug.user.js.d images.built.js chrome/AllInOne/manifest.json chrome/AllInOne/*.user.js built.crx debug.crx
build: clean all
dist:
	rm -f *~ svn-commit.*
lint: built.user.js
	@# http://javascriptlint.com/download.htm
	jsl --conf=lint.conf built.user.js
