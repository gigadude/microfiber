# Microfiber

A simple proof-of-concept javascript fiber module using es6 generators and Promises.

## Example usage

```javascript
let Scheduler = require('microfiber');

function somethingAsync(resolve, reject) {
	let delay = 500 + Math.random() * 1000;
	setTimeout(function done() {
		console.log('async done!');
		resolve(delay);
	}, delay);
}

function* myWork(i) {
	while (i-- > 0) {
		console.log('step', i);
		yield new Promise(somethingAsync);
	}
	console.log('done!');
}

function* master() {
	console.log('starting master fibers...');
	var scheduler = new Scheduler();
	scheduler.add(myWork(3), 'sub job 1');
	scheduler.add(myWork(3), 'sub job 2');
	yield scheduler.run();
}

console.log('starting fibers...');
var scheduler = new Scheduler();
scheduler.add(myWork(5), 'myWork');
scheduler.add(myWork(5), 'myWork');
scheduler.add(master(), 'master');
scheduler.run().then(
	function pass(val) {
		console.log('ran', val, 'tasks');
	},
	function fail(err) {
		console.log('error in tasks:', err);
	}
);
```

## License

MIT.
