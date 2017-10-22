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
	}

	this.import = {
		'B_kh': {},
		'B_kh_msg': {},
		'B_sa': {},
		'B_sa_msg': {},
		'PFlt_flgDewpPfil': {},
		'PFltRgn_flgRgnRunng': {},
		'PFlt_flgEngOn': {},
	}

	this.labels = {
		MDG1MSGCNCPT_SC: 			{initValue: 0},
		PFltSig_tiNormMin_C: 		{initValue: 20},
		PFltSig_dvfEgPfilFildMin_C: {initValue: 35},
		PFltSig_dvfEgPfilFildMax_C: {initValue: 300},
	}

	this.variables = {
		PFltSig_vfEgPfilCorrdFild: {},
		PFltSig_vfEgPfilOldRels: {},
		PFltSig_dvfEgPfilFild: {},
		PFltSig_dvfEgPfilFildAbslt: {},
		timer_PFltSig_tiNormMin: {},
		PFlt_flgEngOnOld: {initValue: 1},
		PFltSig_stRelsCondMon: {},

	}
}