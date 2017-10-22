function PFltSig_PCdng_20ms () {
	this.logic = function ($w) {

		const ESC_tiSampling = 20000;
		// ================ PFltSig_PCdng.Main.Hierachy Start ===================
		// step.1 {PFLT_VAR_SY} => labels, {PFlt_stActv} => import
		if ($w.PFLT_VAR_SY === 11) {
			if (!(Math.getBit(0, $w.PFlt_stActv))) return;
		} else {
			if (!((Math.getBit(0, $w.PFlt_stActv)) && (Math.getBit(1, $w.PFlt_stActv)))) return;
		}

		// step.2
		const _tPFltFilDevB1 = (($w.PFlt_tFilDevB1 > -273.04) ? $w.PFlt_tFilDevB1 : 273.04);

		// step.3 {PFltSig_ratTEgPfil} => variables, {PFltSig_tEgPfilRef_C} => import
		$w.PFltSig_ratTEgPfil = (_tPFltFilDevB1 + 273.14) / $w.PFltSig_tEgPfilRef_C;

		// step.4 {PFltSig_ratRFlowEg} => variables
		$w.PFltSig_ratRFlowEg = Math.interpolation_curve($w.PFltSig_ratTEgPfil, $w.PFltSig_ratRFlowEg_T);

		// step.5 {ExhMod_pExhPfilDsB1, PFlt_pPFltDiffB1, PFlt_mfExhB1} => import
		const _step5_temp1 = ($w.ExhMod_pExhPfilDsB1 + (0.5 * $w.PFlt_pPFltDiffB1)) * 100;
		const _vfEgPfil = (_tPFltFilDevB1 + 273.14) * $w.PFlt_mfExhB1 * 291.73684 / ((_step5_temp1 > 32540)?_step5_temp1:32540);

		// step.6
		const _rhoEgPfil = _step5_temp1 / (291.73684 * (_tPFltFilDevB1 + 273.14));

		// step.7 {PFltSig_vfEgPfilCorrd} => variables
		$w.PFltSig_vfEgPfilCorrd = $w.PFltSig_ratRFlowEg * _vfEgPfil;

		// step.8 {PFltSig_vfSqEgPfilCorrd} => variables
		$w.PFltSig_vfSqEgPfilCorrd = _vfEgPfil * _rhoEgPfil * _vfEgPfil;
		// ================ PFltSig_PCdng.Main.Hierachy End   ===================

		// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_1 Start ================
		// step.9 {PFltSig_vfEgPfilFildBuf3} => variables
		$w.PFltSig_vfEgPfilFildBuf3 = $w.PFltSig_vfEgPfilFildBuf2;

		// step.10 {PFltSig_vfEgPfilFildBuf2} => variables
		$w.PFltSig_vfEgPfilFildBuf2 = $w.PFltSig_vfEgPfilFildBuf1;

		// step.11 {PFltSig_vfEgPfilFildBuf1} => variables
		$w.PFltSig_vfEgPfilFildBuf1 = $w.PFltSig_vfEgPfilFildBuf;

		// step.12 {PFltSig_tiFilVf_C} => labels
		let _muldiv = (2*Math.PI/Math.max($w.PFltSig_tiFilVf_C, 0.0001)) * (ESC_tiSampling / 1000000); // dT单位是um

		// step.13
		let _max  = Math.max(_muldiv, 0.0000000000001);

		// step.14
		let _mul2 = _max * _max;

		// step.15
		let _mul3 = _mul2 * _max;

		// step.16
		let _fac2divx = 2 / _max;

		// step.17
		let _fac2divx2 = 2 / _mul2;

		// step.18
		let _facFilVf2 = -1 / _mul3;

		// step.19
		let _facFilVf1 = (1 + _fac2divx + _fac2divx2) - _facFilVf2;

		// step.20
		let _fac3divx3 = 3 / _mul3;

		// step.21
		let _facFilVf3 = _fac2divx2 + _fac3divx3;

		// step.22
		let _facFilVf4 = -4 / _mul2 - _fac2divx - _fac3divx3;

		// step.23 {PFltSig_vfEgPfilFildBuf} => variables
		$w.PFltSig_vfEgPfilFildBuf = ($w.PFltSig_vfEgPfilCorrd - _facFilVf4 * $w.PFltSig_vfEgPfilFildBuf1 - _facFilVf3 * $w.PFltSig_vfEgPfilFildBuf2 - _facFilVf2 * $w.PFltSig_vfEgPfilFildBuf3) / _facFilVf1;

		// step.24 {PFltSig_vfEgPfilCorrdFild} => variables
		$w.PFltSig_vfEgPfilCorrdFild = $w.PFltSig_vfEgPfilFildBuf;
		// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_1 End   ================

		// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_2 Start ================
		// step.25 {PFltSig_vfSqEgPfilCorrdBuf3} => variables
		$w.PFltSig_vfSqEgPfilCorrdBuf3 = $w.PFltSig_vfSqEgPfilCorrdBuf2;

		// step.26 {PFltSig_vfSqEgPfilCorrdBuf2} => variables
		$w.PFltSig_vfSqEgPfilCorrdBuf2 = $w.PFltSig_vfSqEgPfilCorrdBuf1;

		// step.27 {PFltSig_vfSqEgPfilCorrdBuf1} => variables
		$w.PFltSig_vfSqEgPfilCorrdBuf1 =$w. PFltSig_vfSqEgPfilCorrdBuf;

		// step.28 {PFltSig_vfSqEgPfilCorrdBuf} => variables
		$w.PFltSig_vfSqEgPfilCorrdBuf = ($w.PFltSig_vfSqEgPfilCorrd - (_facFilVf4 * $w.PFltSig_vfSqEgPfilCorrdBuf1) - (_facFilVf3 * $w.PFltSig_vfSqEgPfilCorrdBuf2) - (_facFilVf2 * $w.PFltSig_vfSqEgPfilCorrdBuf3)) / _facFilVf1;

		// step.29 {PFltSig_vfSqEgPfilCorrdFild} => variables
		$w.PFltSig_vfSqEgPfilCorrdFild = $w.PFltSig_vfSqEgPfilCorrdBuf;
		// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_2 End   ================

		// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_3 Start ================
		// step.30 {PFltSig_pPfilDifFildBuf3} => variables
		$w.PFltSig_pPfilDifFildBuf3 = $w.PFltSig_pPfilDifFildBuf2;

		// step.31 {PFltSig_pPfilDifFildBuf2} => variables
		$w.PFltSig_pPfilDifFildBuf2 = $w.PFltSig_pPfilDifFildBuf1;

		// step.32 {PFltSig_pPfilDifFildBuf1} => variables
		$w.PFltSig_pPfilDifFildBuf1 = $w.PFltSig_pPfilDifFildBuf;

		// step.33 {PFltSig_tiFilPDif_C} => labels
		_muldiv	= (2*Math.PI/Math.max($w.PFltSig_tiFilPDif_C, 0.0001)) * (ESC_tiSampling / 1000000); // dT单位是um

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
		$w.PFltSig_pPfilDifFildBuf = ($w.PFlt_pPFltDiffB1 - _facFilPDif4 * $w.PFltSig_pPfilDifFildBuf1 - _facFilPDif3 * $w.PFltSig_pPfilDifFildBuf2 - _facFilPDif2 * $w.PFltSig_pPfilDifFildBuf3) / _facFilPDif1;

		// step.45 {PFltSig_pPfilDifFild} => variables
		$w.PFltSig_pPfilDifFild = $w.PFltSig_pPfilDifFildBuf;

		// step.46 {PFltSig_vfEgPfil} => variables
		$w.PFltSig_vfEgPfil = _vfEgPfil;
		// ================ PFltSig_PCdng.Main.Volumetric_Flow_Filtering_3 End   ================
		
	}

	this.runningStep = 0.02;

	this.import = {
		'PFlt_stActv': {},
		'PFlt_tFilDevB1': {},
		'PFlt_mfExhB1': {},
		'ExhMod_pExhPfilDsB1': {},
		'PFlt_pPFltDiffB1': {},
	}

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