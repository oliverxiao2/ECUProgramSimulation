function PFltSig_Coorr_100ms () {
	this.logic = function ($w) {
		const ESC_tiSampling = 100000;
		// step.1
		if (!((Math.getBit(0, $w.PFlt_stActv)) && (Math.getBit(1, $w.PFlt_stActv)))) return;
	
		// step.2
		// {PFltSig_stEvln, PFltSig_PCorrln2SWE_I} => variables
		// {PFltSig_tiEfcDurnMin_C} => labels
		$w.PFltSig_stEvln = ($w.PFltSig_PCorrln2SWE_I >= $w.PFltSig_tiEfcDurnMin_C);
	
		// step.3/4
		// {PFltSig_stRstCrssCorrln} => import
		const _stRstCrssCorrln = !(Math.bitComp($w.PFltSig_stRelsCondMon, $w.PFltSig_stRstCrssCorrln_C));
		$w.PFltSig_stRstCrssCorrln = ($w.PFltSig_stRstCrssCorrlnMan_C || _stRstCrssCorrln) ? 1 : 0;
	
		// step.5
		// {PFltSig_stHaltCrssCorrln} => import
		$w.PFltSig_stHaltCrssCorrln = (!(Math.bitComp($w.PFltSig_stRelsCondMon, $w.PFltSig_stHaltCrssCorrln_C))) ? 1 : 0;
	
		// step.6/7/8/9/10/11
		// {PFltSig_StMacPBasd} => import
		// {PFltSig_stStMac} => variables
		$w.PFltSig_StMacPBasd.Eval  = $w.PFltSig_stEvln;
		$w.PFltSig_StMacPBasd.Reset = $w.PFltSig_stRstCrssCorrln;
		$w.PFltSig_StMacPBasd.Hold  = $w.PFltSig_stHaltCrssCorrln;
		$w.PFltSig_StMacPBasd.Compu = !(($w.PFltSig_stRstCrssCorrln) || ($w.PFltSig_stHaltCrssCorrln) || ($w.PFltSig_stEvln));
		PFLTSIG_CORRLN_STMAC_IMPL_trigger($w);
		$w.PFltSig_stStMac = convert_PFltSig_stMac($w.PFltSig_StMacPBasd.State);
	
		// step.12/13 E-I timer
		$w.PFltSig_PCorrln2SWE_I = Math.timer_E_I ($w.PFltSig_PCorrln2SWE_I, $w.PFltSig_StMacPBasd.State === 'compute', ($w.PFltSig_StMacPBasd.State == 'restart') || ($w.PFltSig_StMacPBasd.State == 'evaluate'), ESC_tiSampling/1000000);
	
		// step.14
		// {PFltSig_tiEfcDurn} => variables
		$w.PFltSig_tiEfcDurn = $w.PFltSig_PCorrln2SWE_I;
		
		function PFLTSIG_CORRLN_STMAC_IMPL_trigger (_$w) {
			switch (_$w.PFltSig_StMacPBasd.sm) {
				case 'Compute':
					if (_$w.PFltSig_StMacPBasd.Eval) {
						_$w.PFltSig_StMacPBasd.State = 'evaluate';
						_$w.PFltSig_StMacPBasd.sm = 'Evaluate';
						break;
					}
		
					if (_$w.PFltSig_StMacPBasd.Reset) {
						_$w.PFltSig_StMacPBasd.State = 'restart';
						_$w.PFltSig_StMacPBasd.sm = 'Init';
						break;
					}
		
					if (_$w.PFltSig_StMacPBasd.Hold) {
						_$w.PFltSig_StMacPBasd.State = 'wait';
						_$w.PFltSig_StMacPBasd.sm = 'Wait';
						break;
					}
					_$w.PFltSig_StMacPBasd.State = 'compute';
					break;			
		
				case 'Evaluate': 
					if (_$w.PFltSig_StMacPBasd.Compu) {
						_$w.PFltSig_StMacPBasd.State = 'compute';
						_$w.PFltSig_StMacPBasd.sm = 'Compute';
						break;
					}
		
					_$w.PFltSig_StMacPBasd.State = 'restart';
					_$w.PFltSig_StMacPBasd.sm = 'Init';
					break;		
		
				case 'Wait': 
					if (_$w.PFltSig_StMacPBasd.Reset) {
						_$w.PFltSig_StMacPBasd.State = 'restart';
						_$w.PFltSig_StMacPBasd.sm = 'Init';
						break;
					}
		
					if (_$w.PFltSig_StMacPBasd.Compu) {
						_$w.PFltSig_StMacPBasd.State = 'compute';
						_$w.PFltSig_StMacPBasd.sm = 'Compute';
						break;
					}
		
					_$w.PFltSig_StMacPBasd.State = 'wait';
					break;
		
				case 'Init':
				default: 
					if (_$w.PFltSig_StMacPBasd.Compu) {
						_$w.PFltSig_StMacPBasd.State = 'compute';
						_$w.PFltSig_StMacPBasd.sm = 'Compute';
						break;
					}
					_$w.PFltSig_StMacPBasd.State = 'restart';
					break;
			}
		}	

		function convert_PFltSig_stMac (state) {
			switch (state) {
				case 'restart': return 0;
				case 'wait': return 1;
				case 'compute': return 2;
				case 'evaluate': return 3;
			}
		}
	}
	
	this.import = {
		PFlt_stActv: {disable: true},
		PFltSig_stRelsCondMon: {disable: true},
	}

	this.labels = {
		PFltSig_tiEfcDurnMin_C: 	{initValue: 20, bindInputId: 'input_PFltSig_tiEfcDurnMin_C', inputType: 'number'},
		PFltSig_stRstCrssCorrln_C: 	{initValue: 113, bindInputId: 'input_PFltSig_stRstCrssCorrln_C', inputType: 'number'},
		PFltSig_stHaltCrssCorrln_C: {initValue: 13, bindInputId: 'input_PFltSig_stHaltCrssCorrln_C', inputType: 'number'},
	}

	this.variables = {
		PFltSig_stEvln: {},
		PFltSig_PCorrln2SWE_I: {},
		PFltSig_stHaltCrssCorrln: {},
		PFltSig_stRstCrssCorrln: {},
		PFltSig_StMacPBasd: {type: 'object', initValue: {Eval: false, Reset: false, Hold: false, Compu: false}},
		PFltSig_stStMac: {},
		PFltSig_tiEfcDurn: {},
	}
}