#CPPOPTS=-x c++ -ftabstop=2 -P -CC -MD -MT built.user.js -MF built.user.js.d -MP
#built.user.js: Makefile
#	@# The perl script strips any leading blank lines that cpp likes to make...
#	@# the script has been carefully written to not explicitly use any variables, since
#	@# you can't seem to have a dollar sign in the script without make trying to expand it
#	cpp $(CPPOPTS) main.in.js | perl -e "while(<>){last if /\S/};print;print while (<>)" > built.user.js

REVISION=$(shell svn info | grep Revision | awk '{print $$2}')
DATE=$(shell date +%Y-%m-%d)
BUILDOPTS=-DREVISION=$(REVISION) -DBUILDDATE=$(DATE)

built.user.js: Makefile dobuild
	./dobuild $(BUILDOPTS) master.in.js -o built.user.js -d built.user.js.d
debug.user.js: Makefile dobuild
	./dobuild $(BUILDOPTS) -DDEBUG master.in.js -o debug.user.js -d debug.user.js.d

include built.user.js.d
include debug.user.js.d
built.user.js.d:
debug.user.js.d:

.PHONY: all clean debug edit dist
debug: debug.user.js
	cp debug.user.js /home/phlip/.mozilla/firefox/ynorfbh1.default/gm_scripts/homestar_all-in-one/homestar_all-in-one.user.js
all: debug.user.js built.user.js
clean:
	rm -f built.user.js built.user.js.d debug.user.js debug.user.js.d
edit:
	kate Makefile dobuild original.user.js *.txt *.in.js *.h &
dist:
	rm *~
