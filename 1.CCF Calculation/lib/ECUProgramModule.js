/*
    PFltSig_PCdng
    
*/
let CodeStr_PFltSig_PCdng_Main_Volumnetric_Flow_Filtering_3 = 
`
// step.1

// step.2
_tPFltFilDevB1 = ((PFlt_tFilDevB1 > 1) ? PFlt_tFilDevB1 : 1);

// step.3
PFltSig_ratTEgPfil = (_tPFltFilDevB1 + 273.14) / PFltSig_tEgPfilRef_C;

// step4.


// step.30
PFltSig_pPfilDifFildBuf3 = PFltSig_pPfilDifFildBuf2;

// step.31
PFltSig_pPfilDifFildBuf2 = PFltSig_pPfilDifFildBuf1;

// step.32
PFltSig_pPfilDifFildBuf1 = PFltSig_pPfilDifFildBuf;

// step.33
_muldiv	= 2*PI/Math.max(PFltSig_tiFilPDif_C, C6)*(dT/C7); // dT单位是um

// step.34
_max  = Math.max(_muldiv, C8);

// step.35
_mul2 = _max * _max;

// step.36
_mul3 = _mul2 * _max;

// step.37
_fac2divx = C2 / _max;

// step.38
_fac2divx2 = C2 / _mul2;

// step.39
_facFilPDif2 = C3 / _mul3;

// step.40
_facFilPDif1 = (C1 + _fac2divx + _fac2divx2) - _facFilPDif2;

// step.41
_fac3divx3 = C4 / _mul3;

// step.42
_facFilPDif3 = _fac2divx2 + _fac3divx3;

// step.43
_facFilPDif4 = C5 / _mul2 - _fac2divx - _fac3divx3;

// step.44
PFltSig_pPfilDifFildBuf = (PFlt_pPPFltDiff - _facFilPDif4 * PFltSig_pPfilDifFildBuf1 - _facFilPDif3 * PFltSig_pPfilDifFildBuf2 - _facFilPDif2 * PFltSig_pPfilDifFildBuf3) / _facFilPDif1;

// step.45
pFltSig_pPfilDilFild = PFltSig_pPfilDifFildBuf;
`

function ECUModule() {
    let self = this;
    this.codeStr = '';

    this.init = function () {

    }
}

function ECUSim () {
    this.memory = {};
    
}

function parseCodeStr (str) {}

const myECU = new ECUSim();
myECU.memory = {
    C1 : 1,
    C2 : 2,
    C3 : -1,
    C4 : 3,
    C5 : -4,
    C6 : 0.0001,
    C7 : 1000000,
    C8 : 0.0000000000001,
    PI : Math.PI,
    dT : 20000,

    PFltSig_pPfilDifFildBuf : 0,
    PFltSig_pPfilDifFildBuf1: 0,
    PFltSig_pPfilDifFildBuf2: 0,
    PFltSig_pPfilDifFildBuf3: 0,

    _fac2divx,		
    _fac2divx2,
    _fac3divx3,

    _facFilPDif2,
    _facFilPDif1,
    _facFilPDif3,
    _facFilPDif4,

    _muldiv,
    _max,
    _mul2,
    _mul3,
}