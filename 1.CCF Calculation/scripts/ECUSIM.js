function ECUSIM ({
	inputFileHTMLElement,

	}) {
	var self = this;
	this.memory = new ECUMEMORY ();

	this.readMDF = function (inputFileHTMLElement) {

	}

	this.modules = {
		CCF: {
			runningQuery: [{
				i: 1,
				f: PFltSig_PCdng_20ms,
				dT: 20000, //us
				disable: false,
			},{
				i: 2,
				f: PFltSig_RelsPCorrln_100ms,
				dT: 100000, //us
				disable: false,
			}]
		}
	}


	this.stepper = null;

	this.step = 0;

	this.stepIndicator = document.getElementById('step-indicator');
	this.progressIndicator = document.getElementById('progress-indicator');

	this.runModule = function (ECUModule, mdf = self.memory.MDF) {
		importsHandler();
		const timeArray = self.memory.time;
		const maxStep = timeArray.length - 1;
		const sectionLength = 2000;
		const sectionCount = Math.ceil((maxStep+1)/sectionLength);
		let step = 0;

		for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
			setTimeout(() => {
				for (let i = 0; i < sectionLength; i++) {
					step = i + sectionIndex * sectionLength;
					if (step > maxStep) break;
					for (const func of ECUModule.runningQuery) {
						if (!func.disable) {
							readCurrentChannelDataInMemory(step, func.fObj.import);
							func.fObj.logic(self.memory.workplace);
						}					
					}
				}
				if (self.stepIndicator) self.stepIndicator.innerText = (step + 1);
				if (self.progressIndicator) self.progressIndicator.style.width = parseInt(self.progressIndicator.style.width) + 10;
			}, 50*sectionIndex)
		}

		function importsHandler () {
			if (!mdf) return;
			const _array = [];
			let n = 0;
			for (const func of ECUModule.runningQuery) {
				func.fObj = func.fObj || new func.f();
				importChannelDataToMemory(mdf, func.fObj.import);
				for (const _name of func.fObj.import) {
					self.memory.workplace[_name] = 0;
				}

				if (self.memory.timeNormalized) {
					for (const variablename in func.fObj.variables) {
						importChannelDataToMemory(mdf, [variablename]);
						self.memory.workplace[variablename] = 0;
					}

					for (const _name in func.fObj.labels) {
						self.memory.workplace[_name] = func.fObj.labels[_name].initValue || 0;
					}
				}
			}
		}

		function importChannelDataToMemory (mdf, channelnames, memoryNS = self.memory, simStepSize = 0.02) {
			let tEnd, n = self.memory.time ? self.memory.time.length : 0;

			for (const name of channelnames) {
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
					tEnd = tEnd || rawTimeArray[rawTimeArray.length -1];
					n = n || parseInt(tEnd/simStepSize);

					const rawDataArray  = (isDiscrete(theCNBlock)) ? theCNBlock.rawDataArray: theCNBlock.ccBlock.convertAll(theCNBlock.rawDataArray);
					const normTimeArray = new Float32Array(n),
						  normDataArray = new Float32Array(n);

					for (let i = 0, t = 0; i < n; i++) {
						t = i * simStepSize;
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

			function normalizeStep (cnBlock, simStepSize) {

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

		function readCurrentChannelDataInMemory (i, channelnames, memoryNS = self.memory) {
			for (const name of channelnames) {
				memoryNS.workplace[name] = memoryNS.measurements[name][i];
			}
		}
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
			const reader = new FileReader();
			reader.readAsArrayBuffer(file);
			reader.onload = function (e) {
				const arrayBuffer = e.target.result;
				self.memory.MDF = new MDF(arrayBuffer, false);
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
}


Math.getBit = (i, number) => {
	if (typeof number != 'number') return NaN;
	return ((number & (1 << i)) > 0) ? 1 : 0;
}
Math.putBit = (i, value, target, bitLength = 16) => {
	if (typeof target === 'number') {
		if (value) {
			return target | (1 << i);
		} else {
			return target & ((1 << (bitLength+1)) - 1 - (1 << i));
		}
	}
	return NaN;
}
Math.bitComp = (A, B) => {return ((A & B) === B)}
Math.getBitString = (num, bitLength) => {return (num + (1 << (bitLength+1) )).toString(2).substr(1)}
Math.interpolation_curve = (k, curve) => {
	let {x, value} = curve;

	if (typeof x[0] === 'string') {
		x = x.map((d) => parseFloat(d));
		value = value.map((d) => parseFloat(d));
	}


	let n, diff, minDiff;

	for (let i = 0; i < x.length; i++) {
		if (k === x[i]) return value[i];

		if ( (k - x[i]) * (k - x[i+1]) < 0) return Math.interpolate(k, x[i], x[i+1], value[i], value[i+1]);

		if (!((diff = Math.abs(k - x[i])) > minDiff)) {n = i; minDiff = diff;}
	}

	return value[n];
}
Math.interpolate = (xi, x0, x1, y0, y1) => {return y0 + (xi - x0)*(y0 - y1)/(x0 - x1)}

Math.turnOnDelay = (sourceOld, source, timer, T, dT) => {
	let out;

	if (timer > 0) timer -= dT;

	if ((!sourceOld) && source) {
		timer = T;
	}

	if (source && timer > 0) {
		out = source ? 0 : 1; //取反
	} else out = source;

	return {
		value: out,
		t: timer
	}
}

Number.prototype.toFixedNum = function (n) {
	return parseFloat(this.toFixed(n));
}

function PFltSig_PCdng_20ms () {
	this.logic = function (workplace) {
		with (workplace) {
			const ESC_tiSampling = 20000;
			// ================ PFltSig_PCdng.Main.Hierachy Start ===================
			// step.1 {PFLT_VAR_SY} => labels, {PFlt_stActv} => import
			if (PFLT_VAR_SY === 11) {
				if (!(Math.getBit(0, PFlt_stActv))) return;
			} else {
				if (!((Math.getBit(0, PFlt_stActv)) && (Math.getBit(1, PFlt_stActv)))) return;
			}

			// step.2
			const _tPFltFilDevB1 = ((PFlt_tFilDevB1 > -273.04) ? PFlt_tFilDevB1 : 273.04);

			// step.3 {PFltSig_ratTEgPfil} => variables, {PFltSig_tEgPfilRef_C} => import
	  		PFltSig_ratTEgPfil = (_tPFltFilDevB1 + 273.14) / PFltSig_tEgPfilRef_C;

	  		// step.4 {PFltSig_ratRFlowEg} => variables
	  		PFltSig_ratRFlowEg = Math.interpolation_curve(PFltSig_ratTEgPfil, PFltSig_ratRFlowEg_T);

	  		// step.5 {ExhMod_pExhPfilDsB1, PFlt_pPFltDiffB1, PFlt_mfExhB1} => import
	  		const _step5_temp1 = (ExhMod_pExhPfilDsB1 + (0.5 * PFlt_pPFltDiffB1)) * 100;
	  		const _vfEgPfil = (_tPFltFilDevB1 + 273.14) * PFlt_mfExhB1 * 291.73684 / ((_step5_temp1 > 32540)?_step5_temp1:32540);

	  		// step.6
	  		const _rhoEgPfil = _step5_temp1 / (291.73684 * (_tPFltFilDevB1 + 273.14));

	  		// step.7 {PFltSig_vfEgPfilCorrd} => variables
	  		PFltSig_vfEgPfilCorrd = PFltSig_ratRFlowEg * _vfEgPfil;

	  		// step.8 {PFltSig_vfSqEgPfilCorrd} => variables
	  		PFltSig_vfSqEgPfilCorrd = _vfEgPfil * _rhoEgPfil * _vfEgPfil;
			// ================ PFltSig_PCdng.Main.Hierachy End   ===================

			// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_1 Start ================
			// step.9 {PFltSig_vfEgPfilFildBuf3} => variables
			PFltSig_vfEgPfilFildBuf3 = PFltSig_vfEgPfilFildBuf2;

			// step.10 {PFltSig_vfEgPfilFildBuf2} => variables
			PFltSig_vfEgPfilFildBuf2 = PFltSig_vfEgPfilFildBuf1;

			// step.11 {PFltSig_vfEgPfilFildBuf1} => variables
			PFltSig_vfEgPfilFildBuf1 = PFltSig_vfEgPfilFildBuf;

			// step.12 {PFltSig_tiFilVf_C} => labels
			var _muldiv = (2*Math.PI/Math.max(PFltSig_tiFilVf_C, 0.0001)) * (ESC_tiSampling / 1000000); // dT单位是um

			// step.13
			var _max  = Math.max(_muldiv, 0.0000000000001);

			// step.14
			var _mul2 = _max * _max;

			// step.15
			var _mul3 = _mul2 * _max;

			// step.16
			var _fac2divx = 2 / _max;

			// step.17
			var _fac2divx2 = 2 / _mul2;

			// step.18
			var _facFilVf2 = -1 / _mul3;

			// step.19
			var _facFilVf1 = (1 + _fac2divx + _fac2divx2) - _facFilVf2;

			// step.20
			var _fac3divx3 = 3 / _mul3;

			// step.21
			var _facFilVf3 = _fac2divx2 + _fac3divx3;

			// step.22
			var _facFilVf4 = -4 / _mul2 - _fac2divx - _fac3divx3;

			// step.23 {PFltSig_vfEgPfilFildBuf} => variables
			PFltSig_vfEgPfilFildBuf = (PFltSig_vfEgPfilCorrd - _facFilVf4 * PFltSig_vfEgPfilFildBuf1 - _facFilVf3 * PFltSig_vfEgPfilFildBuf2 - _facFilVf2 * PFltSig_vfEgPfilFildBuf3) / _facFilVf1;

			// step.24 {PFltSig_vfEgPfilCorrdFild} => variables
			PFltSig_vfEgPfilCorrdFild = PFltSig_vfEgPfilFildBuf;
			// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_1 End   ================

			// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_2 Start ================
			// step.25 {PFltSig_vfSqEgPfilCorrdBuf3} => variables
			PFltSig_vfSqEgPfilCorrdBuf3 = PFltSig_vfSqEgPfilCorrdBuf2;

			// step.26 {PFltSig_vfSqEgPfilCorrdBuf2} => variables
			PFltSig_vfSqEgPfilCorrdBuf2 = PFltSig_vfSqEgPfilCorrdBuf1;

			// step.27 {PFltSig_vfSqEgPfilCorrdBuf1} => variables
			PFltSig_vfSqEgPfilCorrdBuf1 = PFltSig_vfSqEgPfilCorrdBuf;

			// step.28 {PFltSig_vfSqEgPfilCorrdBuf} => variables
			PFltSig_vfSqEgPfilCorrdBuf = (PFltSig_vfSqEgPfilCorrd - (_facFilVf4 * PFltSig_vfSqEgPfilCorrdBuf1) - (_facFilVf3 * PFltSig_vfSqEgPfilCorrdBuf2) - (_facFilVf2 * PFltSig_vfSqEgPfilCorrdBuf3)) / _facFilVf1;

			// step.29 {PFltSig_vfSqEgPfilCorrdFild} => variables
			PFltSig_vfSqEgPfilCorrdFild = PFltSig_vfSqEgPfilCorrdBuf;
			// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_2 End   ================

			// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_3 Start ================
			// step.30 {PFltSig_pPfilDifFildBuf3} => variables
			PFltSig_pPfilDifFildBuf3 = PFltSig_pPfilDifFildBuf2;

			// step.31 {PFltSig_pPfilDifFildBuf2} => variables
			PFltSig_pPfilDifFildBuf2 = PFltSig_pPfilDifFildBuf1;

			// step.32 {PFltSig_pPfilDifFildBuf1} => variables
			PFltSig_pPfilDifFildBuf1 = PFltSig_pPfilDifFildBuf;

			// step.33 {PFltSig_tiFilPDif_C} => labels
			_muldiv	= (2*Math.PI/Math.max(PFltSig_tiFilPDif_C, 0.0001)) * (ESC_tiSampling / 1000000); // dT单位是um

			// step.34
			_max  = Math.max(_muldiv, 0.0000000000001);

			// step.35
			_mul2 = _max * _max;

			// step.36
			_mul3 = _mul2 * _max;

			// step.37
			_fac2divx = 2 / _max;

			// step.38
			_fac2divx2 = 2 / _mul2;

			// step.39
			_facFilPDif2 = -1 / _mul3;

			// step.40
			_facFilPDif1 = (1 + _fac2divx + _fac2divx2) - _facFilPDif2;

			// step.41
			_fac3divx3 = 3 / _mul3;

			// step.42
			_facFilPDif3 = _fac2divx2 + _fac3divx3;

			// step.43
			_facFilPDif4 = -4 / _mul2 - _fac2divx - _fac3divx3;

			// step.44 {PFltSig_pPfilDifFildBuf} => variables
			PFltSig_pPfilDifFildBuf = (PFlt_pPFltDiffB1 - _facFilPDif4 * PFltSig_pPfilDifFildBuf1 - _facFilPDif3 * PFltSig_pPfilDifFildBuf2 - _facFilPDif2 * PFltSig_pPfilDifFildBuf3) / _facFilPDif1;

			// step.45 {PFltSig_pPfilDifFild} => variables
			PFltSig_pPfilDifFild = PFltSig_pPfilDifFildBuf;

			// step.46 {PFltSig_vfEgPfil} => variables
			PFltSig_vfEgPfil = _vfEgPfil;
			// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_3 End   ================
		}
	}

	this.runningStep = 0.02;

	this.import = [
		'PFlt_stActv',
		'PFlt_tFilDevB1',
		'PFlt_mfExhB1',
		'ExhMod_pExhPfilDsB1',
		'PFlt_pPFltDiffB1',
	]

	this.labels = {
		PFLT_VAR_SY:  				{readonly: true, initValue: 385},
		PFltSig_tiFilPDif_C: 		{initValue: 5},
		PFltSig_tEgPfilRef_C: 		{initValue: 293},
		PFltSig_ratRFlowEg_T: 		{initValue:{"x":[0.761,1.224,1.687,2.15,2.613,3.076,3.539,4.002,4.465,4.928,5.391],"value":[0.817,1.162,2.02,2.07,2.072,2.149,2.309,2.79,3.026,3.255,3.479]}},
		PFltSig_tiFilVf_C: 			{initValue:5},
	}

	this.variables = {
		PFltSig_ratTEgPfil: 		{},
		PFltSig_ratRFlowEg: 		{},
		PFltSig_vfEgPfilCorrd: 		{},
		PFltSig_vfSqEgPfilCorrd: 	{},
		PFltSig_vfEgPfilFildBuf3: 	{},
		PFltSig_vfEgPfilFildBuf2: 	{},
		PFltSig_vfEgPfilFildBuf1: 	{},
		PFltSig_vfEgPfilFildBuf: 	{},
		PFltSig_vfEgPfilCorrdFild: 	{},
		PFltSig_vfSqEgPfilCorrdBuf3:{},
		PFltSig_vfSqEgPfilCorrdBuf2:{},
		PFltSig_vfSqEgPfilCorrdBuf1:{},
		PFltSig_vfSqEgPfilCorrdBuf: {},
		PFltSig_vfSqEgPfilCorrdFild:{},
		PFltSig_pPfilDifFildBuf3: 	{},
		PFltSig_pPfilDifFildBuf2: 	{},
		PFltSig_pPfilDifFildBuf1: 	{},
		PFltSig_pPfilDifFildBuf: 	{},
		PFltSig_pPfilDifFild: 		{},

	}
}

function PFltSig_RelsPCorrln_100ms () {
	this.logic = function (workplace) {
		const ESC_tiSampling = 100000;
			// step.1
			if (!((Math.getBit(0, workplace.PFlt_stActv)) && (Math.getBit(1, workplace.PFlt_stActv)))) return;

			// step.2 {PFltSig_vfEgPfilCorrdFild, PFltSig_vfEgPfilOldRels, PFltSig_dvfEgPfilFild}=> variables
			let _t1 =  (workplace.PFltSig_vfEgPfilCorrdFild - workplace.PFltSig_vfEgPfilOldRels) / ESC_tiSampling * 1000000;
			workplace.PFltSig_dvfEgPfilFild = ((_t1 >= -32768) ? ((_t1 <= 32767) ? _t1 : 32767) : -32768);

			// step.3 {PFltSig_dvfEgPfilFildAbslt} => variables
			workplace.PFltSig_dvfEgPfilFildAbslt = Math.abs((workplace.PFltSig_dvfEgPfilFild > -32767) ? workplace.PFltSig_dvfEgPfilFild : -32767);

			// step.4
			workplace.PFltSig_vfEgPfilOldRels = workplace.PFltSig_vfEgPfilCorrdFild;

			// step.5
			// {PFlt_flgEngOnOld, PFlt_flgEngOn, timer_PFltSig_tiNormMin} => import
			// {PFltSig_tiNormMin_C} => labels
			// {PFlt_flgEngOnOld} => variables
			let _delay_result = Math.turnOnDelay (workplace.PFlt_flgEngOnOld, workplace.PFlt_flgEngOn, workplace.timer_PFltSig_tiNormMin, workplace.PFltSig_tiNormMin_C, ESC_tiSampling/1000000);
			let _t2_bit6 = _delay_result.value;
			workplace.timer_PFltSig_tiNormMin = _delay_result.t;
			workplace.PFlt_flgEngOnOld = workplace.PFlt_flgEngOn;

			// step.6 not blocked byF FId DINH_stFId_PFltSigRelsPCorrln
			// {PFltSig_stRelsCondMon} => variables
			workplace.PFltSig_stRelsCondMon = Math.putBit(0, 1, workplace.PFltSig_stRelsCondMon, 16);

			// step.7
			// {MDG1MSGCNCPT_SC} => labels
			if (workplace.MDG1MSGCNCPT_SC) {
				workplace.PFltSig_stRelsCondMon = Math.putBit(1, !(workplace.B_kh_msg), workplace.PFltSig_stRelsCondMon, 16);
			} else {
				workplace.PFltSig_stRelsCondMon = Math.putBit(1, !(workplace.B_kh), workplace.PFltSig_stRelsCondMon, 16);
			}

			// step.8
			if (workplace.MDG1MSGCNCPT_SC) {
				workplace.PFltSig_stRelsCondMon = Math.putBit(2, !(workplace.B_sa_msg), workplace.PFltSig_stRelsCondMon, 16);
			} else {
				workplace.PFltSig_stRelsCondMon = Math.putBit(2, !(workplace.B_sa), workplace.PFltSig_stRelsCondMon, 16);
			}

			// step.9
			const _t2_bit3 = (workplace.PFltSig_dvfEgPfilFildAbslt >= workplace.PFltSig_dvfEgPfilFildMin_C && workplace.PFltSig_dvfEgPfilFildAbslt <= workplace.PFltSig_dvfEgPfilFildMax_C)?1:0;
			workplace.PFltSig_stRelsCondMon = Math.putBit(3, _t2_bit3, workplace.PFltSig_stRelsCondMon, 16);

			// step.10
			// {PFlt_flgDewpPfil} => import
			workplace.PFltSig_stRelsCondMon = Math.putBit(4, workplace.PFlt_flgDewpPfil, workplace.PFltSig_stRelsCondMon, 16);

			// step.11
			// {PFltRgn_flgRgnRunng} => import
			workplace.PFltSig_stRelsCondMon = Math.putBit(5, workplace.PFltRgn_flgRgnRunng?0:1, workplace.PFltSig_stRelsCondMon, 16);

			// step.12
			workplace.PFltSig_stRelsCondMon = Math.putBit(6, _t2_bit6, workplace.PFltSig_stRelsCondMon, 16);
		/*
		with (workplace) {
			const ESC_tiSampling = 100000;
			// step.1
			if (!((Math.getBit(0, PFlt_stActv)) && (Math.getBit(1, PFlt_stActv)))) return;

			// step.2 {PFltSig_vfEgPfilCorrdFild, PFltSig_vfEgPfilOldRels, PFltSig_dvfEgPfilFild}=> variables
			let _t1 =  (PFltSig_vfEgPfilCorrdFild - PFltSig_vfEgPfilOldRels) / ESC_tiSampling * 1000000;
			PFltSig_dvfEgPfilFild = ((_t1 >= -32768) ? ((_t1 <= 32767) ? _t1 : 32767) : -32768);

			// step.3 {PFltSig_dvfEgPfilFildAbslt} => variables
			PFltSig_dvfEgPfilFildAbslt = Math.abs((PFltSig_dvfEgPfilFild > -32767) ? PFltSig_dvfEgPfilFild : -32767);

			// step.4
			PFltSig_vfEgPfilOldRels = PFltSig_vfEgPfilCorrdFild;

			// step.5
			// {PFlt_flgEngOnOld, PFlt_flgEngOn, timer_PFltSig_tiNormMin} => import
			// {PFltSig_tiNormMin_C} => labels
			// {PFlt_flgEngOnOld} => variables
			let _delay_result = Math.turnOnDelay (PFlt_flgEngOnOld, PFlt_flgEngOn, timer_PFltSig_tiNormMin, PFltSig_tiNormMin_C, ESC_tiSampling/1000000);
			let _t2_bit6 = _delay_result.value;
			timer_PFltSig_tiNormMin = _delay_result.t;
			PFlt_flgEngOnOld = PFlt_flgEngOn;

			// step.6 not blocked byF FId DINH_stFId_PFltSigRelsPCorrln
			// {PFltSig_stRelsCondMon} => variables
			PFltSig_stRelsCondMon = Math.putBit(0, 1, PFltSig_stRelsCondMon, 16);

			// step.7
			// {MDG1MSGCNCPT_SC} => labels
			if (MDG1MSGCNCPT_SC) {
				PFltSig_stRelsCondMon = Math.putBit(1, !B_kh_msg, PFltSig_stRelsCondMon, 16);
			} else {
				PFltSig_stRelsCondMon = Math.putBit(1, !B_kh, PFltSig_stRelsCondMon, 16);
			}

			// step.8
			if (MDG1MSGCNCPT_SC) {
				PFltSig_stRelsCondMon = Math.putBit(2, !B_sa_msg, PFltSig_stRelsCondMon, 16);
			} else {
				PFltSig_stRelsCondMon = Math.putBit(2, !B_sa, PFltSig_stRelsCondMon, 16);
			}

			// step.9
			const _t2_bit3 = (PFltSig_dvfEgPfilFildAbslt >= PFltSig_dvfEgPfilFildMin_C && PFltSig_dvfEgPfilFildAbslt <= PFltSig_dvfEgPfilFildMax_C)?1:0;
			PFltSig_stRelsCondMon = Math.putBit(3, _t2_bit3, PFltSig_stRelsCondMon, 16);

			// step.10
			// {PFlt_flgDewpPfil} => import
			PFltSig_stRelsCondMon = Math.putBit(4, PFlt_flgDewpPfil, PFltSig_stRelsCondMon, 16);

			// step.11
			// {PFltRgn_flgRgnRunng} => import
			PFltSig_stRelsCondMon = Math.putBit(5, PFltRgn_flgRgnRunng?0:1, PFltSig_stRelsCondMon, 16);

			// step.12
			PFltSig_stRelsCondMon = Math.putBit(6, _t2_bit6, PFltSig_stRelsCondMon, 16);
		}
		*/
	}

	this.import = ['B_kh',
		'B_kh_msg',
		'B_sa',
		'B_sa_msg',
		'PFlt_flgDewpPfil',
		'PFltRgn_flgRgnRunng',
		'PFlt_flgEngOn',]

	this.labels = {
		MDG1MSGCNCPT_SC: {initValue:0},
		PFltSig_tiNormMin_C: {initValue:20},
		PFltSig_dvfEgPfilFildMin_C: {initValue:0},
		PFltSig_dvfEgPfilFildMax_C: {initValue:0},
	}

	this.variables = {
		PFltSig_vfEgPfilCorrdFild: {},
		PFltSig_vfEgPfilOldRels: {},
		PFltSig_dvfEgPfilFild: {},
		timer_PFltSig_tiNormMin: {},
		PFlt_flgEngOnOld: {},
		PFltSig_stRelsCondMon: {},

	}
}

function PFltSig_Coorr_100ms () {
	with (memory) {
	// step.1
	if (!((getBit(0, PFlt_stActv)) && (getBit(1, PFlt_stActv)))) return;

	// step.2
	PFltSig_stEvln = (PFltSig_PCorrln2SWE_I >= PFltSig_tiEfcDurnMin_C);

	// step.3/4
	_stRstCrssCorrln = !(bitComp(PFltSig_stRelsCondMon, PFltSig_stRstCrssCorrln_C));
	PFltSig_stRstCrssCorrln = (PFltSig_stRstCrssCorrlnMan_C || _stRstCrssCorrln);

	// step.5
	PFltSig_stHaltCrssCorrln = !(bitComp(PFltSig_stRelsCondMon, PFltSig_stHaltCrssCorrln_C));

	// step.6/7/8/9/10/11
	PFltSig_StMacPBasd.Eval  = PFltSig_stEvln;
	PFltSig_StMacPBasd.Reset = PFltSig_stRstCrssCorrln;
	PFltSig_StMacPBasd.Hold  = PFltSig_stHaltCrssCorrln;
	PFltSig_StMacPBasd.Compu = !((PFltSig_stRstCrssCorrln) || (PFltSig_stHaltCrssCorrln) || (PFltSig_stEvln));
	PFLTSIG_CORRLN_STMAC_IMPL_trigger();
	PFltSig_stStMac = PFltSig_StMacPBasd.State;

	// step.12/13 E-I timer
	PFltSig_PCorrln2SWE_I = timer_E_I (PFltSig_PCorrln2SWE_I, PFltSig_StMacPBasd.State === 'compute', (PFltSig_StMacPBasd.State == 'restart') || (PFltSig_StMacPBasd.State == 'evaluate'), ESC_tiSampling/1000000);

	// step.14
	PFltSig_tiEfcDurn = PFltSig_PCorrln2SWE_I;
	}
}

function PFltSig_PCorrln_100ms () {
	with(memory) {
		// step.1
		if (!((getBit(0, PFlt_stActv)) && (getBit(1, PFlt_stActv)))) return;

		// step.2
		PFltSig_flgPCorrlnSuc = (PFltSig_stStMac == 'evaluate');

		// step.3
		PFltSig_pDeltaPfilDifFild = PFltSig_pPfilDifFild - PFltSig_pPfilDifFildOld;

		// step.4
		PFltSig_vfDeltaEgPfilCorrdFild = PFltSig_vfEgPfilCorrdFild - PFltSig_vfEgPfilCorrdBufOld;
		// step.5
		PFltSig_vfSqDeltaEgPfilCorrdFild = PFltSig_vfSqEgPfilCorrdFild - PFltSig_vfSqEgPfilCorrdOld;

		// step.6
		PFltSig_pPfilDifFildOld = PFltSig_pPfilDifFild;

		// step.7
		PFltSig_vfEgPfilCorrdBufOld = PFltSig_vfEgPfilCorrdFild;

		// step.8
		PFltSig_vfSqEgPfilCorrdOld = PFltSig_vfSqEgPfilCorrdFild;

		// step.9
		PFltSig_pDeltaPfilDifRef = PFltSig_vfDeltaEgPfilCorrdFild * PFltSig_rFlowPfilRef_C + PFltSig_vfSqDeltaEgPfilCorrdFild * PFltSig_facPDeltaPfilRefCorr_C;

		// step.10
		if (PFltSig_stStMac == 'compute') {
    		PFltSig_facPCrssCorrln = PFltSig_pDeltaPfilDifFild * PFltSig_pDeltaPfilDifRef + PFltSig_facPCrssCorrln;
    		PFltSig_facPSelfCorrln = (PFltSig_pDeltaPfilDifRef * PFltSig_pDeltaPfilDifRef) + PFltSig_facPSelfCorrln;
    		PFltSig_ratPCorrlnBuf1 = (0.0000001 > PFltSig_facPSelfCorrln) ? PFltSig_ratPCorrlnBuf2 : (PFltSig_facPCrssCorrln / PFltSig_facPSelfCorrln);
  		}

  		// step.11
  		if (PFltSig_stStMac == 'evaluate') {
    		PFltSig_ratPCorrlnBuf2 = PFltSig_ratPCorrlnBuf1;
  		}

  		// step.12
  		if ((PFltSig_stStMac == 'evaluate') || (PFltSig_stStMac == 'restart')) {
    		PFltSig_facPCrssCorrln = 0.00000005;
    		PFltSig_facPSelfCorrln = 0.0000001;
    		PFltSig_ratPCorrlnBuf1 = 0.5;
		}

  		PFltSig_ratPCorrln = (PFltSig_ratPCorrlnBuf2 < -32.768) ? -32.768 : ((PFltSig_ratPCorrlnBuf2 > 32.767) ? 32.767 : PFltSig_ratPCorrlnBuf2);
	}
}

/*
程序运行顺序
选择要运行的模块名称（或者仿真的功能名称）
导入数据源，读取模块需要的输入数据，存入ECUMEMORY实例的measurements属性中，注意数据类型float32Array
初始化ECUMEMORY实例的workplace

*/
