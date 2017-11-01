function ECUSIM ({
	inputFileHTMLElement,

	}) {
	var self = this;
	this.memory = new ECUMEMORY ();

	this.modules = {
		CCF: {
			basedT: 0.1,
			runningQuery: [{
				i: 4,
				f: PFltSig_PCorrln_100ms_100_9_0,
				dT: 0.1, //s
				disable: false,
			}],
			initialized: false,
		}
		/*
		{
			i: 1,
			f: PFltSig_PCdng_20ms,
			dT: 0.02, //s
			disable: true,
		},{
			i: 2,
			f: PFltSig_RelsPCorrln_100ms,
			dT: 0.1, //s
			disable: true,
		},{
			i: 3,
			f: PFltSig_Coorr_100ms,
			dT: 0.1, //s
			disable: true,
		},
		*/
	}

	this.stepper = null;

	this.step = 0;

	this.stepIndicator = document.getElementById('step-indicator');
	this.progressIndicator = document.getElementById('progress-indicator');
	this.logBox = document.getElementById('log')

	this.runModule = function ({
		ECUModule,
		mdf = self.memory.MDF,
		startup = 3500, // unit: points
		mode = 1,
		}) {
		if(init() === 'mdf not ready') {
			alert('MDF未解析完')
			return;
		}
		ECUModule.initialized = true;
		let loopTimes = 0;
		const maxLoopTimes = 10;
		const timeArray = self.memory.time;
		const maxStep = timeArray.length - 1;
		const sectionLength = 2000;
		const sectionHandleTime = 200; //ms
		const sectionCount = Math.ceil((maxStep+1)/sectionLength);
		let step = 0;

		self.memory.errorResultList = [];
		let errorStorage = [];
		const error_startupSteps = 3500;
		const error_target = 1.0;
		let error, mean;
		let A0_step = document.getElementById('A0_scan_step').valueAsNumber,
			B_step = document.getElementById('B_scan_step').valueAsNumber,
			A0_k = document.getElementById('A0_k').valueAsNumber,
			B_k = document.getElementById('B_k').valueAsNumber;
		let A0_init = document.getElementById('input_PFltSig_rFlowPfilRef_C').valueAsNumber,
			B_init = document.getElementById('input_PFltSig_facPDeltaPfilRefCorr_C').valueAsNumber;
		let error_x = [], error_y = [], error_z = [];
		let scanTime = 500; //ms

		if (mode == 1) {
			for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
				setTimeout(() => {					
					for (let i = 0; i < sectionLength; i++) {
						self.step = step = i + sectionIndex * sectionLength;
						if (step > maxStep) break;
						else {
							for (const func of ECUModule.runningQuery) {
								if (step <= startup) {
									readCurrentChannelDataInMemory(step, func.fObj, self.memory, true);
								} else {
									if (!func.disable && (step % parseInt(func.dT/ECUModule.basedT) === 0)) {
										readCurrentChannelDataInMemory(step, func.fObj, self.memory, false);
										func.fObj.logic(self.memory.workplace);
									}
								}												
							}
						}
						
						archiveChannels(step, self.memory);

						if (self.stepIndicator) self.stepIndicator.innerText = parseInt((step/maxStep)*100) + '%';
						if (self.progressIndicator) self.progressIndicator.style.width = parseInt((sectionIndex+1)/sectionCount*100) + '%';
												
						
						// 评价CCF计算
						if (step >= error_startupSteps) error_PFltSig_ratPCorrln (errorStorage, self.memory.workplace);

						// 画图
						if (step >= maxStep) {
							document.getElementById('tab1').click();
							setTimeout(() => {
								f2();
							}, 1000)
						}
					}					
				}, 1000 + sectionHandleTime*(sectionIndex+1))
			}

		} else if (mode ==2) {
			let logTable = document.getElementById('table');
			let timer = 0;
			var func1 = function(callback, A0, B){
				setTimeout(()=>{
					self.memory.workplace.PFltSig_rFlowPfilRef_C = A0;
					self.memory.workplace.PFltSig_facPDeltaPfilRefCorr_C = B;
				
					for (step = 0; step < maxStep; step++) {
						for (const func of ECUModule.runningQuery) {
							if (step <= error_startupSteps) {
								readCurrentChannelDataInMemory(step, func.fObj, self.memory, true);
							} else {
								if (!func.disable && (step % parseInt(func.dT/ECUModule.basedT) === 0)) {
									readCurrentChannelDataInMemory(step, func.fObj, self.memory, false);
									func.fObj.logic(self.memory.workplace);
									error_PFltSig_ratPCorrln(errorStorage, self.memory.workplace);
								}
							}												
						}
					}

					timer++;
					mean = Math.mean(errorStorage);
					error = Math.sqrt(mean);
					error_z.push(error);
					self.memory.errorResultList.push({
						A0: self.memory.workplace.PFltSig_rFlowPfilRef_C,
						B: self.memory.workplace.PFltSig_facPDeltaPfilRefCorr_C,
						error: error,
						mean: mean,
						errorStorage: errorStorage,
					})
					self.logBox.innerHTML = parseFloat(timer / ((2*A0_k+1) * (2*B_k+1)) * 100).toFixed(2) + '%, 剩余时间:' + Math.getTime(((2*A0_k+1) * (2*B_k+1) - timer)*scanTime/1000);
					
					errorStorage = [];
					self.memory.workplace = {};
					for (const name in self.memory.archives) {
						self.memory.archives[name] = [];
					}
					
					init();
					typeof(callback) !== 'function' || callback();
				}, scanTime);
						
			};
	
			var promisify = function(func, A0, B){
				return function(){
				  return new Promise(function(resolve){
					func(resolve, A0, B);
				  });
				}
			}
			
			const func_arr = [];
			
			for (let i = -A0_k; i <= A0_k; i++) {
				error_x.push(A0_init+i*A0_step);
				for (let j = -B_k; j <= B_k; j++) {
					if (i === -A0_k) error_y.push(B_init+j*B_step);
					func_arr.push(promisify(func1, A0_init+i*A0_step, B_init+j*B_step));
				}
			}
	
			func_arr.reduce(function(cur, next) {
				return cur.then(next);
			}, Promise.resolve()).then(function() {
				let xSize = error_x.length,
					ySize = error_y.length,
					z= [];
				for (let i = 0; i < xSize; i++) {
					z[i] = error_z.slice(i*ySize, (i+1)*ySize);
				}

				var contourData ={
					x: error_x,
					y: error_y,
					z: numeric.transpose(z),
					type: 'contour',
					contours: {
						coloring: 'heatmap'
					}
					//colorscale: [[0, 'rgb(166,206,227)'], [0.25, 'rgb(31,120,180)'], [0.45, 'rgb(178,223,138)'], [0.65, 'rgb(51,160,44)'], [0.85, 'rgb(251,154,153)'], [1, 'rgb(227,26,28)']]
				  };
				console.log(contourData);
				  
				  var layout = {
					title: '扫描图' + '<br> A0初始值' + A0_init + ', 扫描范围'+(A0_init-A0_k*A0_step)+' - '+(A0_init+A0_k*A0_step) 
						+'<br> B初始值' + B_init + ', 扫描范围'+(B_init-B_k*B_step)+' - '+(B_init+B_k*B_step),
				  };
				  document.getElementById('tab2').click();
				  setTimeout(()=>{
					  Plotly.newPlot('contourDiv', [contourData], layout);
				  }, 1000);

				  const fs = require('fs');
				  const outputErrorList = Object.assign(self.memory.errorResultList);
				  for (const item of outputErrorList) {
					  delete item.errorStorage;
				  }
				  const jsonObj = {
					  A0_init: A0_init,
					  B_init: B_init,
					  A0_step: A0_step,
					  B_step: B_step,
					  A0_k: A0_k,
					  B_k: B_k,
					  data: outputErrorList,
					  contourData: contourData,
				  }
				  const filepath = document.getElementById('importMDFFile').files[0].path;
				  fs.writeFileSync(filepath + '_' +(new Date()).toString().replace(/\:/g, '-') +'.json',JSON.stringify(jsonObj, null, '\t'),{encoding:'utf-8'});
			});
		}

		function init () {
			if (!ECUModule.initialized) {			
				
			} else {
				// clear memory.workplace
				self.memory.workplace = {};
			}
			setTimeout(()=> {
				if (self.progressIndicator) self.progressIndicator.style.width = '0%';
			}, 0)
			
			if (!mdf) return 'mdf not ready';
			let n;
			for (const func of ECUModule.runningQuery) {
				func.fObj = func.fObj || new func.f();
				if (!self.memory.timeNormalized) {
					n = importChannelDataToMemory(mdf, func, self.memory, ECUModule.basedT);
				}				
				for (const name in func.fObj.import) {
					self.memory.workplace[name] = 0;
				}

				if (self.memory.timeNormalized) {
					for (const variablename in func.fObj.variables) {
						self.memory.workplace[variablename] = func.fObj.variables[variablename].initValue || 0;
						self.memory.archives[variablename] = self.memory.archives[variablename] || [];
					}

					for (const name in func.fObj.labels) {
						let label, inputId, inputType, value;
						label = func.fObj.labels[name];
						inputId = label.bindInputId;
						inputType = label.inputType;
						if (inputId) {
							if (inputType === 'number') value = document.getElementById(inputId).valueAsNumber;
						}

						self.memory.workplace[name] = value || label.initValue || 0;
					}
				}
			}			
		}

		function importChannelDataToMemory (mdf, func, memoryNS = self.memory, simStepSize = 0.02, needInterpolation) {
			let tStart, tEnd, n = self.memory.time ? self.memory.time.length : 0, fObj = func.fObj;
			const nameCollection = Object.keys(fObj.import).concat(Object.keys(fObj.variables));
			for (const name of nameCollection) {
				if(func.disable || (fObj.import[name] && fObj.import[name].disable)) continue;
				let theCNBlock;
				let result = mdf.searchChannelsByRegExp(new RegExp(name+'\\\\'));
				if (result.length > 0) theCNBlock = result[0];
				else {
					result = mdf.searchChannelsByRegExp(name);
					if (result.length > 0) theCNBlock = result[0];
					else theCNBlock = null;
				}

				if (theCNBlock) {
					if (theCNBlock.rawDataArray.length === 0) mdf.readDataBlockOf(theCNBlock, mdf.arrayBuffer);
					const timeCNBlock  = theCNBlock.parent.cnBlocks[0],
						  rawTimeArray = timeCNBlock.rawDataArray;
					if (rawTimeArray.length === 0) mdf.readDataBlockOf(timeCNBlock, mdf.arrayBuffer);

					tStart = tStart || rawTimeArray[0];
					tEnd = tEnd || rawTimeArray[rawTimeArray.length -1];
					n = n || parseInt(tEnd/simStepSize);

					const rawDataArray  = (isDiscrete(theCNBlock)) ? theCNBlock.rawDataArray: theCNBlock.ccBlock.convertAll(theCNBlock.rawDataArray);
					const normTimeArray = new Float64Array(n),
						  normDataArray = new Float64Array(n);

					for (let i = 0, t = tStart; i < n; i++) {
						t += simStepSize;
						if (!memoryNS.timeNormalized) normTimeArray[i] = t;
						normDataArray[i] = (binarySearchChannel(t, rawTimeArray, rawDataArray, theCNBlock.isDiscrete));
					}

					if (!memoryNS.timeNormalized) memoryNS.time = normTimeArray;
					memoryNS.measurements[name] = normDataArray;
					memoryNS.timeNormalized = true;

				} else {
					memoryNS.measurements[name] = [];
				}
			}

			return n;

			function isBoolChannel (cnBlock) {
				const _c = cnBlock.ccBlock.additionalConversionData;

				if (_c.length === 4 && _c[0] === 0 && _c[2] === 1) {
					if (typeof _c[1] === 'string' && typeof _c[3] === 'string') {
						if (_c[1].match(/FALSE/i) && _c[3].match(/TRUE/i)) {
							return cnBlock.isBool = true;
						}
					}
				}

				return cnBlock.isBool = false;
			}

			function isDiscrete (cnBlock) {
				const _c = cnBlock.ccBlock.additionalConversionData;

				const len = _c.length;
				for (let i = 1; i < len; i+=2) {
					if (typeof _c[i] != 'string') return cnBlock.isDiscrete = false;
				}

				return cnBlock.isDiscrete = true;
			}
		}

		function binarySearchChannel (t, timeArray, dataArray, isDiscrete = false) {
		    const n = timeArray.length;
		    if (dataArray.length != n) {
		        console.log('The size of time and data don\'t match');
		        return NaN;
		    }
		    const tMin = timeArray[0];
		    const tMax = timeArray[n - 1];
			if (t <= tMin) return dataArray[0];
			if (t >= tMax) return dataArray[n - 1];

			let low = 0, high = n - 1, tMid = 0, mid = parseInt((t - timeArray[low])/(timeArray[high] - timeArray[low])*(high - low)) + low;

			while (low <= high) {
				tMid = timeArray[mid];
				if (t > tMid) {
					if ( (t-timeArray[mid]) * (t-timeArray[mid+1]) < 0 ) {
						if (isDiscrete) {
							return (Math.abs(t - timeArray[mid]) < Math.abs(t - timeArray[mid+1]))?dataArray[mid]:dataArray[mid+1];
						} else {
							return Math.interpolate(t, timeArray[mid], timeArray[mid+1], dataArray[mid], dataArray[mid+1]);
						}
					}
					low = mid;
					mid = (parseInt((t - timeArray[low])/(timeArray[high] - timeArray[low])*(high - low)) | 1) + low;
				} else if ( t < tMid) {
					if ( (t-timeArray[mid]) * (t-timeArray[mid-1]) < 0 ) {
						if (isDiscrete) {
							return (Math.abs(t - timeArray[mid]) < Math.abs(t - timeArray[mid-1]))?dataArray[mid]:dataArray[mid-1];
						} else {
							return Math.interpolate(t, timeArray[mid-1], timeArray[mid], dataArray[mid-1], dataArray[mid]);
						}
					}
					high = mid;
					mid = high - (parseInt((timeArray[high] - t)/(timeArray[high] - timeArray[low])*(high - low)) | 1);
				} else {
					return dataArray[mid];
				}
			}
		}

		function readCurrentChannelDataInMemory (i, fObj, memoryNS, readVariable = false) {
			for (const name in fObj.import) {
				if (!fObj.import[name].disable) {
					memoryNS.workplace[name] = memoryNS.measurements[name][i];
				}
			}

			if (readVariable) {
				for (const name in fObj.variables) {
					if (memoryNS.measurements[name] && memoryNS.measurements[name].length > 0) {
						memoryNS.workplace[name] = memoryNS.measurements[name][i];
					}					
				}
			}
		}

		function archiveChannels (i, memoryNS = self.memory) {
			for (const name in memoryNS.workplace) {
				if (memoryNS.archives[name] === undefined) memoryNS.archives[name] = [];
				memoryNS.archives[name][i] = memoryNS.workplace[name];
			}
		}

		function result () {
			const div = document.getElementById('log');
			error = Math.sqrt(Math.mean(errorStorage));
			console.log(errorStorage, errorStorage.length)
			errorStorage = [];
			ECUModule.initialized = false;
			init();
			div.innerHTML += '<br><p>Error of CCF: '+ error +'</p>';
		}
	}

	this.updateChart = function (names, boxId) {
		if (!document.getElementById(boxId)) {
			const newBox = document.createElement('div');
			newBox.className = 'ECUChart';
			newBox.id = boxId;
			document.getElementById('chart-collection-box').appendChild(newBox);
		}
		const traces = [];
		const timeData = Array.from(self.memory.time); // 不支持Float64Array
		const layout = {};
		const groupCount = names.length;

		for (const [i, name] of names.entries()) {
			let simuData = self.memory.archives[name];
			if (!simuData) continue;
			if (typeof simuData[0] === 'boolean') simuData = simuData.map((d) => {return d?1:0});
			const measData = Array.from(self.memory.measurements[name]);
			
			const s = {
				name: '[S]'+name,
				x: timeData,
				y: simuData,
			}
			const m = {
				name: '[M]'+name,
				x: timeData,
				y: measData,				
			}
			if (i === 0) {
				layout.legend = {traceorder: 'reverse'};
			} else if (i > 0) {
				s.yaxis = m.yaxis = 'y'+(i+1);
			}

			layout['yaxis'+(i+1)] = {domain: [i/groupCount, (i+1)/groupCount]};
			traces.push(s);
			traces.push(m);
		}

		
		Plotly.newPlot(boxId, traces, layout);
	}

	function getCurveFromTable (tableHTMLElement) {
		const output = {
			x: [],
			value: []
		};

		const x_inputs = tableHTMLElement.querySelectorAll('[name=x] input');
		const v_inputs = tableHTMLElement.querySelectorAll('[name=value] input');

		for (let i=0; i<x_inputs.length; i++) {output.x.push(x_inputs[i].valueAsNumber)}
		for (let i=0; i<v_inputs.length; i++) {output.value.push(v_inputs[i].valueAsNumber)}

		return output;
	}

	function archiveChannels (channelnames, memoryNS = memory) {
		for (const name of channelnames) {
			if (memory.archives[name] === undefined) memory.archives[name] = [];
			memory.archives[name].push(memoryNS[name]);
		}
	}

	function clearMemoryArchives () {
		for (const key in memory.archives) {
			memory.archives[key] = [];
		}
	}

	(function init() {
		inputFileHTMLElement.addEventListener('change', function () {
			const file = this.files[0];
			const path = require('path');
			const ext = path.extname(file.path);			
			if (ext.toUpperCase() == '.DAT') {
				document.getElementById('input_filename').value = path.basename(file.path);
				const reader = new FileReader();
				reader.readAsArrayBuffer(file);
				reader.onload = function (e) {
					const arrayBuffer = e.target.result;
					self.memory.MDF = new MDF(arrayBuffer, false);
					alert('测量文件就绪');
				}
			} else {
				alert('注意数据文件后缀名为dat')
			}			
		})
	})();
}

function ECUMEMORY () {
	this.MDF = null;

	this.UTILITY = {}; // functions

	this.time;

	// measurements用于模块的数据输入，数据来自MDF测量文件，输入之前需要进行时间轴的定步长规范化，一旦确定，不再改变
	this.measurements = {};

	// 当前环境可用变量，程序第一次运行之前需要初始化变量名
	this.workplace = {};

	// 存档
	this.archives = {};

	this.charts = {};

	this.errorResultList = [];
}

/*
程序运行顺序
选择要运行的模块名称（或者仿真的功能名称）
导入数据源，读取模块需要的输入数据，存入ECUMEMORY实例的measurements属性中，注意数据类型Float64Array
初始化ECUMEMORY实例的workplace

*/
