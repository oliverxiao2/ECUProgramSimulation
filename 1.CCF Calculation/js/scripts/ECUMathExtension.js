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

Math.timer_E_I = (old, E, I, dT) => {
	let out = old;
	if (E) out += dT;
	if (I) out = 0;
	return out;
}

Math.resample = (array, pts) => {
	const max = array.length;
	if (pts >= max) return array;
	const k = (max - 1)/(pts - 1);
	const output = [];
	for (let i = 0; i < pts; i++) {
		output.push(array[parseInt(i*k)])
	}
	return output;
}

Math.regression = (x, y, k) => {
	const X = [];
	for (let i = 0; i<x.length; i++) {
		const Xi = [];

		for (let j = 1; j <= k; j++) {
			Xi.push(Math.pow(x[i], j));
		}
		X.push(Xi);
	}
	const XT  = numeric.transpose(X);
	const _t1 = numeric.inv(numeric.dot(XT, X));
	const _t2 = numeric.dot(_t1, XT); 
	return numeric.dot(_t2, y);
}

Math.regressionXY = (X, Y) => {
	const XT  = numeric.transpose(X);
	const _t1 = numeric.inv(numeric.dot(XT, X));
	const _t2 = numeric.dot(_t1, XT); 
	return numeric.dot(_t2, Y);
}

Math.mean = (array) => {
	if (array.length > 0) {
		let sum = 0;
		array.map((d) => {sum+=d});
		return sum/array.length;
	}
	return NaN;
}

Math.arange = (start, end, step = 1) => {
	const output = [];
	for (let i = start; i <= end; i+=step) {
		output.push(i);
	}
	return output;
}
Math.getMax = (array) => {
	let output;
	for (const item of array) {
		if (output === undefined || item > output) output = item;
	}
	return output;
}
Math.getMin = (array) => {
	let output;
	for (const item of array) {
		if (output === undefined || item < output) output = item;
	}
	return output;
}
Math.polyEquation = (corr) => {
	let output = 'y=';
	corr = corr.reverse();
	let power;
	for (const [i, item] of corr.entries()) {
		power = corr.length - i - 1;
		if (i === 0) {
			output += item + 'x' + power;
		} else if (i === corr.length - 1) {
			if (item>0) output += '+' + item ;
			else  output +=  item;
		} else {
			if (item>0) output += '+' + item + 'x' + power;
			else  output +=  item + 'x' + power;
		}
		
	}
	return output;
}
Math.getTime = (sec) => {
	const m = Math.floor(sec/60);
	const s = sec - m * 60;
	return (m ? (m + 'min ') : '') + (s + 'sec');
}
Math.getContourData = (array) => {
	let x = [], y = [], z = [];
	const strArray = Object.assign(array);

	for (const item of strArray) {
		item.A0 = (item.A0.toFixed(8));
		item.B = (item.B.toFixed(8));
		item.error = (item.error.toFixed(8));
		item.mean = (item.mean.toFixed(8));

		if (x.indexOf(item.A0) === -1) x.push(item.A0);
		if (y.indexOf(item.B) === -1) y.push(item.B);

	}

	x = x.sort();
	y = y.sort();

	for (const item of strArray) {
		const i = item.A0.indexOf(x);
		const j = item.B.indexOf(y);
		if (z[j] === undefined) z[j] = [];
		z[j][i] = item.error;
	}

	x = x.map((d) => parseFloat(d));
	y = y.map((d) => parseFloat(d));
	z = z.map((d) => {
		return d.map((v) => {
			return parseFloat(v);
		})
	})

	return {x, y, z};
}