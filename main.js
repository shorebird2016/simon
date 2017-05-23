angular.module('simonApp', [])
    .controller('simonCtrl', function ($timeout, $interval, $document) {
        var vm = this;
        vm.powerOn = false;
        vm.LED = "OFF";
        vm.playerClicks = [];//stores R G B Y
        vm.masterTunes = [];
        vm.curStepCount = -1;//none yet
        vm.strictMode = false;
        vm.newCycle = false;
        vm.intvPromise; vm.tmrPromise;

        vm.clickColorButton = function (color_code) {
            if (!vm.powerOn || vm.curStepCount === 20) return;//do nothing
            //TODO $timeout.cancel(vm.tmrPromise);

            //light up button, play tune
            normalColor(color_code); playColorTune(color_code);
            vm.playerClicks.push(color_code);

            //does the new click match master's, previous clicks should have been matched
            if (color_code !== vm.masterTunes[vm.playerClicks.length - 1]) {
                vm.LED = "??";
                var fail_snd = new Audio("sound/aww.wav"); fail_snd.play();

                //for strict mode, reset to beginning
                if (vm.strictMode) {
                    $timeout(function () {
                        dimmerColor(color_code);//turn off light after 300ms, start playing next cycle
                        vm.startGame(); }, 500);
                    return;
                }

                //normal mode - play all tunes once more, give player a chance to try again
                $timeout(function () {
                    dimmerColor(color_code);//turn off light after 300ms, start playing next cycle
                    playTunes(vm.curStepCount);
                    vm.playerClicks = [];//if length = 0, restart new cycle
                }, 300);
                return;
            }

            //if new cycle just started, wait till expected clicks are in (or timeout)
            if (vm.playerClicks.length < vm.curStepCount) {
                $timeout(function () {//turn off light after 300ms, start playing next cycle
                    dimmerColor(color_code); }, 300);
            }
            else {//reach expected count w/o error, begin new cycle
                vm.curStepCount++;
                vm.LED = vm.curStepCount;
                if (vm.curStepCount === 20) {
                    playerWins();
                    return;
                }

                $timeout(function () {
                    dimmerColor(color_code);//turn off light after 300ms, start playing next cycle
                    playTunes(vm.curStepCount);
                    vm.playerClicks = [];//if length = 0, new cycle
                }, 300);
            }

        };
        vm.powerOnOff = function () {
            if (vm.powerOn) {
                vm.powerOn = false;
                vm.LED = "OFF";
                //change background color
                angular.element(document.querySelector('#dv-pwr-left')).css("background-color", 'blue');
                angular.element(document.querySelector('#dv-pwr-rite')).css("background-color", 'black');
            }
            else {
                vm.powerOn = true;
                vm.LED = 1;
                angular.element(document.querySelector('#dv-pwr-left')).css("background-color", 'black');
                angular.element(document.querySelector('#dv-pwr-rite')).css("background-color", 'blue');
            }
        };
        vm.togleStrictMode = function () {
            if (!vm.powerOn || vm.curStepCount === 20) return;
            vm.strictMode = !vm.strictMode;
            if (vm.strictMode)
                angular.element(document.querySelector('#dv-strict')).css("background-color", "#fafc32");
            else
                angular.element(document.querySelector('#dv-strict')).css("background-color", "#d0d608");

        };

        //--start game, reset counter, create new tunes, play 1st tune after 1s
        vm.startGame = function () {
            if (!vm.powerOn) return;
            vm.LED = 1;
            vm.playerClicks = [];
            generateTunes(); vm.curStepCount = 1;
            playTunes(1);

            //TODO wait 5 second to decide if player pushed button
            // vm.tmrPromise = $timeout(function () {
            //     wrongButtonOrTimeout();
            // }, 5000);
        };

        //--play current sound from index
        function colorToSound(color_code) {
            var snd = "sound1";
            switch (color_code) {
                case 'R': snd = "sound1"; break;
                case 'G': snd = "sound2"; break;
                case 'B': snd = "sound3"; break;
                case 'Y': snd = "sound4"; break;
            }
            return snd;
        }
        function colorToId(color_code) {
            switch (color_code) {
                case 'R': return "dv-red";
                case 'G': return "dv-green";
                case 'B': return "dv-blue";
                case 'Y': return "dv-yellow";
            }
            return null;
        }

        //--play a number of tunes from vm.masterTunes
        function playTunes(count) {
            //a loop playing num_steps then wait for players entry
            var step = 0; var pre_color = null; vm.playLoopDone = false;
            vm.intvPromise = $interval(function () {
                if (pre_color != null)
                    dimmerColor(pre_color);//turn off last one
                if (!vm.playLoopDone) {
                    var audio = new Audio("sound/" + colorToSound(vm.masterTunes[step]) + ".mp3");
                    audio.play();
                    var color_code = vm.masterTunes[step];
                    normalColor(color_code);
                    pre_color = color_code;
                    step++;
                    if (step === count) {
                        vm.playLoopDone = true;//set flag to timeout once more
                    }
                }
                else {
                    $interval.cancel(vm.intvPromise);//extra cycle to dim the last click
                }
            }, 1000);
        }

        //--generate a random tune for 20 steps
        function generateTunes() {
            for (var step = 0; step < 20; step++) {
                var tune = 'R';
                var idx = Math.floor(Math.random() * 0.4 * 10);//should be 0..3
                switch (idx) {
                    case 0:
                        tune = 'R';
                        break;
                    case 1:
                        tune = 'G';
                        break;
                    case 2:
                        tune = 'B';
                        break;
                    case 3:
                        tune = 'Y';
                        break;
                }
                vm.masterTunes.push(tune);
            }
        }

        //--assign dimmerColor color for each color button, color_code = R G B Y
        function dimmerColor(color_code) {
            var to_color = "#7d150e";
            switch (color_code) {
                case 'R': to_color =  "#7d150e"; break;
                case 'G': to_color =  "#005B00"; break;
                case 'B': to_color =  "#070d88"; break;
                case 'Y': to_color =  "#767c08"; break;
            }
            angular.element(document.querySelector('#' + colorToId(color_code))).css("background-color", to_color);
        }
        function normalColor(color_code) {
            var to_color = "red";
            switch (color_code) {
                case 'R': to_color = "red"; break;
                case 'G': to_color = "#00cb00"; break;
                case 'B': to_color = "blue"; break;
                case 'Y': to_color = "yellow"; break;
            }
            angular.element(document.querySelector('#' + colorToId(color_code))).css("background-color", to_color);
        }
        function wrongButtonOrTimeout() {//player push wrong button or didn't push button within 5 sec
            vm.LED = "??";
            var fail_snd = new Audio("sound/aww.wav"); fail_snd.play();
            dimmerColor(vm.masterTunes[vm.curStepCount]);
        }
        function playerWins() {//player push wrong button or didn't push button within 5 sec
            vm.LED = "**";
            var snd = new Audio("sound/applause.wav"); snd.play();
            dimmerColor(vm.masterTunes[vm.curStepCount]);
        }
        function playColorTune(color_code) {
            var audio = new Audio("sound/" + colorToSound(color_code) + ".mp3");
            audio.play();
        }
    });


//TODO paint power on/off buttons based on on/off clicks between red/green
//TODO use associative array for sound lookup
//--mapping color to sound name R -> sound1, G -> sound2..etc
//const SOUND_MAP = ['sound1', 'sound2', 'sound3', 'sound4'];//R G B Y

