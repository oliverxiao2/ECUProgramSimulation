function PFltSig_PCorrln_100ms () {
	this.logic = function ($w) {
		// 0: restart
		// 1: wait
		// 2: compute
		// 3: evaluate
		// step.1
		if (!((Math.getBit(0, $w.PFlt_stActv)) && (Math.getBit(1, $w.PFlt_stActv)))) return;

		// step.2
		// {PFltSig_flgPCorrlnSuc} => variables
		// {PFltSig_stStMac} => import
		$w.PFltSig_flgPCorrlnSuc = ($w.PFltSig_stStMac === 3)?1:0; 

		// step.3
		// {PFltSig_pDeltaPfilDifFild, PFltSig_pPfilDifFildOld} => variables
		// {PFltSig_pPfilDifFild} => import
		$w.PFltSig_pDeltaPfilDifFild = $w.PFltSig_pPfilDifFild - $w.PFltSig_pPfilDifFildOld;

		// step.4
		// {PFltSig_vfDeltaEgPfilCorrdFild, PFltSig_vfEgPfilCorrdBufOld} => variables
		// {PFltSig_vfEgPfilCorrdFild} => import
		$w.PFltSig_vfDeltaEgPfilCorrdFild = $w.PFltSig_vfEgPfilCorrdFild - $w.PFltSig_vfEgPfilCorrdBufOld;

		// step.5
		// {PFltSig_vfSqDeltaEgPfilCorrdFild, PFltSig_vfSqEgPfilCorrdOld} => variables
		// {PFltSig_vfSqEgPfilCorrdFild} => import
		$w.PFltSig_vfSqDeltaEgPfilCorrdFild = $w.PFltSig_vfSqEgPfilCorrdFild - $w.PFltSig_vfSqEgPfilCorrdOld;

		// step.6
		$w.PFltSig_pPfilDifFildOld = $w.PFltSig_pPfilDifFild;

		// step.7
		$w.PFltSig_vfEgPfilCorrdBufOld = $w.PFltSig_vfEgPfilCorrdFild;

		// step.8
		$w.PFltSig_vfSqEgPfilCorrdOld = $w.PFltSig_vfSqEgPfilCorrdFild;

		// step.9
		// {PFltSig_pDeltaPfilDifRef} => variables
		// {PFltSig_rFlowPfilRef_C, PFltSig_facPDeltaPfilRefCorr_C} => labels
		$w.PFltSig_pDeltaPfilDifRef = $w.PFltSig_vfDeltaEgPfilCorrdFild * $w.PFltSig_rFlowPfilRef_C + $w.PFltSig_vfSqDeltaEgPfilCorrdFild * $w.PFltSig_facPDeltaPfilRefCorr_C;

		// step.10
		// {PFltSig_facPCrssCorrln, PFltSig_facPSelfCorrln, PFltSig_ratPCorrlnBuf1, PFltSig_ratPCorrlnBuf2} => variables
		if ($w.PFltSig_stStMac === 2) {
    		$w.PFltSig_facPCrssCorrln += $w.PFltSig_pDeltaPfilDifFild * $w.PFltSig_pDeltaPfilDifRef;
    		$w.PFltSig_facPSelfCorrln += $w.PFltSig_pDeltaPfilDifRef * $w.PFltSig_pDeltaPfilDifRef;
    		$w.PFltSig_ratPCorrlnBuf1 = (0.0000001 > $w.PFltSig_facPSelfCorrln) ? $w.PFltSig_ratPCorrlnBuf2 : ($w.PFltSig_facPCrssCorrln / $w.PFltSig_facPSelfCorrln);
  		}

  		// step.11
  		if ($w.PFltSig_stStMac === 3) {
    		$w.PFltSig_ratPCorrlnBuf2 = $w.PFltSig_ratPCorrlnBuf1;
  		}

  		// step.12
  		if (($w.PFltSig_stStMac === 3 ) || ($w.PFltSig_stStMac === 0)) {
    		$w.PFltSig_facPCrssCorrln = 0.00000005;
    		$w.PFltSig_facPSelfCorrln = 0.0000001;
    		$w.PFltSig_ratPCorrlnBuf1 = 0.5;
		}

		// {PFltSig_ratPCorrln} => variables
		$w.PFltSig_ratPCorrln = ($w.PFltSig_ratPCorrlnBuf2 < -32.768) ? -32.768 : (($w.PFltSig_ratPCorrlnBuf2 > 32.767) ? 32.767 : $w.PFltSig_ratPCorrlnBuf2);
	}

	this.import = {
		PFlt_stActv: {},
		PFltSig_stStMac: {},
		PFltSig_pPfilDifFild: {},
		PFltSig_vfEgPfilCorrdFild: {},
		PFltSig_vfSqEgPfilCorrdFild: {},
	}

	this.labels = {
		PFltSig_rFlowPfilRef_C: 		{initValue: 0.0097, bindInputId: 'input_PFltSig_rFlowPfilRef_C', inputType: 'number'},
		PFltSig_facPDeltaPfilRefCorr_C: {initValue: 0.000001, bindInputId: 'input_PFltSig_facPDeltaPfilRefCorr_C', inputType: 'number'},
	}

	this.variables = {
		PFltSig_flgPCorrlnSuc: {},
		PFltSig_pDeltaPfilDifFild: {},
		PFltSig_vfDeltaEgPfilCorrdFild: {},
		PFltSig_vfSqDeltaEgPfilCorrdFild: {},
		PFltSig_pPfilDifFildOld: {},
		PFltSig_vfEgPfilCorrdBufOld: {},
		PFltSig_vfSqEgPfilCorrdOld: {},
		PFltSig_pDeltaPfilDifRef: {},
		PFltSig_facPCrssCorrln: {},
		PFltSig_facPSelfCorrln: {},
		PFltSig_ratPCorrlnBuf1: {},
		PFltSig_ratPCorrlnBuf2: {},
		PFltSig_ratPCorrln: {},
	}
}

function error_PFltSig_ratPCorrln (errorArray, $w) {
	const CCF = $w.PFltSig_ratPCorrlnB1;
	errorArray.push(Math.pow((CCF-1), 2));
}

function PFltSig_PCorrln_100ms_100_9_0 () {
	// 变量名字为100.7.0版本

	this.logic = function ($w) {
		// 0: restart
		// 1: wait
		// 2: compute
		// 3: evaluate
		// step.1
		if (!((Math.getBit(0, $w.PFlt_stActv)) && (Math.getBit(1, $w.PFlt_stActv)))) return;

		// step.2
		// {PFltSig_flgPCorrlnSuc} => variables
		// {PFltSig_stStMac} => import
		$w.PFltSig_flgPCorrlnSuc = ($w.PFltSig_stStMac === 3)?1:0; 

		// step.3
		// {PFltSig_pDeltaPfilDifFild, PFltSig_pPfilDifFildOld} => variables
		// {PFltSig_pPfilDifFild} => import
		$w.PFltSig_pDeltaPfilDifFildB1 = $w.PFltSig_pPfilDifFild - $w.PFltSig_pPfilDifFildOld;

		// step.4
		// {PFltSig_vfDeltaEgPfilCorrdFild, PFltSig_vfEgPfilCorrdBufOld} => variables
		// {PFltSig_vfEgPfilCorrdFild} => import
		$w.PFltSig_vfDeltaEgPfilCorrdFild = $w.PFltSig_vfEgPfilCorrdFild - $w.PFltSig_vfEgPfilCorrdBufOld;

		// step.5
		// {PFltSig_vfSqDeltaEgPfilCorrdFild, PFltSig_vfSqEgPfilCorrdOld} => variables
		// {PFltSig_vfSqEgPfilCorrdFild} => import
		$w.PFltSig_vfSqDeltaEgPfilCorrdFild = $w.PFltSig_vfSqEgPfilCorrdFild - $w.PFltSig_vfSqEgPfilCorrdOld;

		// step.6
		$w.PFltSig_pPfilDifFildOld = $w.PFltSig_pPfilDifFild;

		// step.7
		$w.PFltSig_vfEgPfilCorrdBufOld = $w.PFltSig_vfEgPfilCorrdFild;

		// step.8
		$w.PFltSig_vfSqEgPfilCorrdOld = $w.PFltSig_vfSqEgPfilCorrdFild;

		// step.9
		// {PFltSig_pDeltaPfilDifRef} => variables
		// {PFltSig_rFlowPfilRef_C, PFltSig_facPDeltaPfilRefCorr_C} => labels
		$w.PFltSig_pDeltaPfilDifRef = $w.PFltSig_vfDeltaEgPfilCorrdFild * $w.PFltSig_rFlowPfilRef_C + $w.PFltSig_vfSqDeltaEgPfilCorrdFild * $w.PFltSig_facPDeltaPfilRefCorr_C;
		$w.PFltSig_pPfilDifRef = $w.PFltSig_vfEgPfilCorrdFild * $w.PFltSig_rFlowPfilRef_C + $w.PFltSig_vfSqEgPfilCorrdFild * $w.PFltSig_facPDeltaPfilRefCorr_C;
		$w.PFltSig_pDeltaPfilDifRef = $w.PFltSig_pPfilDifRef - $w.PFltSig_pPfilDifRefOld;
		$w.PFltSig_pPfilDifRefOld = $w.PFltSig_pPfilDifRef;
		// step.10
		// {PFltSig_facPCrssCorrln, PFltSig_facPSelfCorrln, PFltSig_ratPCorrlnBuf1, PFltSig_ratPCorrlnBuf2} => variables
		if ($w.PFltSig_stStMac === 2) {
    		$w.PFltSig_facPCrssCorrln += $w.PFltSig_pDeltaPfilDifFild * $w.PFltSig_pDeltaPfilDifRef;
    		$w.PFltSig_facPSelfCorrln += $w.PFltSig_pDeltaPfilDifRef * $w.PFltSig_pDeltaPfilDifRef;
    		$w.PFltSig_ratPCorrlnBuf1 = (0.0000001 > $w.PFltSig_facPSelfCorrln) ? $w.PFltSig_ratPCorrlnBuf2 : ($w.PFltSig_facPCrssCorrln / $w.PFltSig_facPSelfCorrln);
  		}

  		// step.11
  		if ($w.PFltSig_stStMac === 3) {
    		$w.PFltSig_ratPCorrlnBuf2 = $w.PFltSig_ratPCorrlnBuf1;
  		}

  		// step.12
  		if (($w.PFltSig_stStMac === 3 ) || ($w.PFltSig_stStMac === 0)) {
    		$w.PFltSig_facPCrssCorrln = 0.00000005;
    		$w.PFltSig_facPSelfCorrln = 0.0000001;
    		$w.PFltSig_ratPCorrlnBuf1 = 0.5;
		}

		// {PFltSig_ratPCorrln} => variables
		$w.PFltSig_ratPCorrln = ($w.PFltSig_ratPCorrlnBuf2 < -32.768) ? -32.768 : (($w.PFltSig_ratPCorrlnBuf2 > 32.767) ? 32.767 : $w.PFltSig_ratPCorrlnBuf2);
	}

	this.logic = function ($w) {
		// step
		if (!((Math.getBit(0, $w.PFlt_stActv)) && (Math.getBit(1, $w.PFlt_stActv)))) return;

		// step
		$w.PFltSig_pPfilDifRefB1 = $w.PFltSig_vfEgPfilCorrdFildB1 * $w.PFltSig_rFlowPfilRef_C + $w.PFltSig_vfSqEgPfilCorrdFildB1 * $w.PFltSig_facPDeltaPfilRefCorr_C;

		// step
		$w.PFltSig_pDeltaPfilDifRefB1 = $w.PFltSig_pPfilDifRefB1 - $w.PFltSig_pDeltaPfilDifRefOldB1;
		$w.PFltSig_pDeltaPfilDifRefOldB1 = $w.PFltSig_pPfilDifRefB1;

		// step
		$w.PFltSig_pDeltaPfilDifFildB1 = $w.PFltSig_pPfilDifFildB1 - $w.PFltSig_pDeltaPfilDifFildOldB1;
		$w.PFltSig_pDeltaPfilDifFildOldB1 = $w.PFltSig_pPfilDifFildB1;

		// step
		if ($w.PFltSig_stStMacB1  === 2) {
    		$w.PFltSig_facPCrssCorrln += $w.PFltSig_pDeltaPfilDifFildB1 * $w.PFltSig_pDeltaPfilDifRefB1;
    		$w.PFltSig_facPSelfCorrln += $w.PFltSig_pDeltaPfilDifRefB1 * $w.PFltSig_pDeltaPfilDifRefB1;
    		$w.PFltSig_ratPCorrlnBuf1 = (0.0000001 > $w.PFltSig_facPSelfCorrln) ? $w.PFltSig_ratPCorrlnBuf2 : ($w.PFltSig_facPCrssCorrln / $w.PFltSig_facPSelfCorrln);
  		}

  		// step.11
  		if ($w.PFltSig_stStMacB1  === 3) {
    		$w.PFltSig_ratPCorrlnBuf2 = $w.PFltSig_ratPCorrlnBuf1;
  		}

  		// step.12
  		if (($w.PFltSig_stStMacB1  === 3 ) || ($w.PFltSig_stStMacB1  === 0)) {
    		$w.PFltSig_facPCrssCorrln = 0.00000005;
    		$w.PFltSig_facPSelfCorrln = 0.0000001;
    		$w.PFltSig_ratPCorrlnBuf1 = 0.5;
		}

		$w.PFltSig_ratPCorrlnB1 = ($w.PFltSig_ratPCorrlnBuf2 < -32.768) ? -32.768 : (($w.PFltSig_ratPCorrlnBuf2 > 32.767) ? 32.767 : $w.PFltSig_ratPCorrlnBuf2);
	}

	this.import = {
		PFlt_stActv: {},
		PFltSig_stStMacB1: {},
		'PFltSig_pPfilDifFildB1': {},
		'PFltSig_vfEgPfilCorrdFildB1': {},
		'PFltSig_vfSqEgPfilCorrdFildB1': {},
	}

	this.labels = {
		PFltSig_rFlowPfilRef_C: 		{initValue: 0.0097, bindInputId: 'input_PFltSig_rFlowPfilRef_C', inputType: 'number'},
		PFltSig_facPDeltaPfilRefCorr_C: {initValue: 0.000001, bindInputId: 'input_PFltSig_facPDeltaPfilRefCorr_C', inputType: 'number'},
	}

	this.variables = {
		PFltSig_flgPCorrlnSuc: {},
		PFltSig_pDeltaPfilDifFildB1: {},
		PFltSig_pDeltaPfilDifRefOldB1: {},
		PFltSig_vfDeltaEgPfilCorrdFildB1: {},
		PFltSig_vfSqDeltaEgPfilCorrdFildB1: {},		

		PFltSig_pDeltaPfilDifRefB1: {},
		PFltSig_facPCrssCorrln: {},
		PFltSig_facPSelfCorrln: {},
		PFltSig_ratPCorrlnBuf1: {},
		PFltSig_ratPCorrlnBuf2: {},
		PFltSig_ratPCorrlnB1: {},

		PFltSig_pPfilDifRef: {},
		PFltSig_pPfilDifRefOld: {},
	}	
}