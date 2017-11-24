#CPPOPTS=-x c++ -ftabstop=2 -P -CC -MD -MT built.user.js -MF built.user.js.d -MP
#built.user.js: Makefile
#	@# The perl script strips any leading blank lines that cpp likes to make...
#	@# the script has been carefully written to not explicitly use any variables, since
#	@# you can't seem to have a dollar sign in the script without make trying to expand it
#	cpp $(CPPOPTS) main.in.js | perl -e "while(<>){last if /\S/};print;print while (<>)" > built.user.js

REVISION=$(shell git rev-list HEAD --count)
DATE=$(shell date +%Y-%m-%d)
BUILDOPTS=-DREVISION=$(REVISION) -DBUILDDATE=$(DATE)

default: built.user.js built.crx built.zip

built.user.js: Makefile dobuild images.built.js
	./dobuild $(BUILDOPTS) master.in.js -o built.user.js -d built.user.js.d
debug.user.js: Makefile dobuild images.built.js
	./dobuild $(BUILDOPTS) -DDEBUG master.in.js -o debug.user.js -d debug.user.js.d
built.crx: Makefile buildmanifest built.user.js chrome/AllInOne/*.png
	./buildmanifest built.user.js > chrome/AllInOne/manifest.json
	rm -f chrome/AllInOne/*.user.js
	cp built.user.js chrome/AllInOne/built.user.js
	google-chrome --pack-extension=chrome/AllInOne --pack-extension-key=chromekey.pem
	mv chrome/AllInOne.crx built.crx
debug.crx: Makefile buildmanifest debug.user.js chrome/AllInOne/*.png
	./buildmanifest debug.user.js > chrome/AllInOne/manifest.json
	rm -f chrome/AllInOne/*.user.js
	cp debug.user.js chrome/AllInOne/debug.user.js
	google-chrome --pack-extension=chrome/AllInOne --pack-extension-key=chromekey.pem
	mv chrome/AllInOne.crx debug.crx
built.zip: Makefile buildmanifest built.user.js chrome/AllInOne/*.png
	./buildmanifest built.user.js > chrome/AllInOne/manifest.json
	rm -f chrome/AllInOne/*.user.js
	cp built.user.js chrome/AllInOne/built.user.js
	rm -f built.zip
	( cd chrome && zip -r ../built.zip AllInOne/built.user.js AllInOne/manifest.json AllInOne/*.png )


images.built.js: Makefile buildimages images/*.png
	./buildimages images/*.png > images.built.js

include built.user.js.d
include debug.user.js.d
built.user.js.d:
debug.user.js.d:

.PHONY: all clean debug build dist default lint debuglint
debug: debug.user.js debug.crx
all: built.user.js built.crx built.zip debug.user.js debug.crx
clean:
	rm -f built.user.js built.user.js.d debug.user.js debug.user.js.d images.built.js chrome/AllInOne/manifest.json chrome/AllInOne/*.user.js built.crx built.zip debug.crx
build: clean all
dist: clean all lint debuglint
	rm -f *~ svn-commit.*

# http://javascriptlint.com/download.htm
lint: built.user.js
	jsl --conf=lint.conf built.user.js
debuglint: debug.user.js
	jsl --conf=lint.conf debug.user.js
