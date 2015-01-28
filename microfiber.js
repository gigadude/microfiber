//
// microfiber.js - simple fibers with generators and promises
//

'use strict';

let util = require('util');

function Scheduler() {
	this.queue = [];
	this.promises = new Set();
	this.nextid = 0;
	this.errorcount = 0;
}

//
// Scheduler.add - add a task (a generator function) and optionally name it
//

Scheduler.prototype.add = function add(gen, name) {
	let task = {
		gen: gen,
		id: ++this.nextid,
		name: name || '<anon>'
	}
	//console.log('add', task.name + '[' + task.id + ']'); 
	this.queue.push(task);
};

// private method, could hide in a closure
Scheduler.prototype.rerun = function rerun(resolve, reject) {
	console.log('running', this.queue.length, 'tasks');

	while (this.queue.length > 0) {
		let task = this.queue.shift();
		let name = task.name + '[' + task.id + ']';
		console.log('run', name);
		let ret = task.gen.next();
		if (!ret.done) {
			task.promise = ret.value;
			this.promises.add(task.promise);
			task.promise.then(
				function resolved(val) {
					//console.log('resolved', name, 'with', val);
					this.promises.delete(task.promise);
					this.queue.push(task);
					return val;
				}.bind(this),
				function rejected(err) {
					//console.log('rejected', name, 'with', err);
					this.promises.delete(task.promise);
					// ideally we'd throw to the task here, possible?
					++this.errorcount;
					return err;
				}.bind(this)
			);
		}
	}
	
	// when any of the above promises settle, start running again
	if (this.promises.size > 0) {
		let list = [];
		for (let item of this.promises.values()) list.push(item);
		//console.log('waiting for', this.promises.size, 'tasks', util.inspect(list.map(function(item) { return item instanceof Promise; })));
		let rerun = this.rerun.bind(this, resolve, reject);
		Promise.race(list).then(rerun, rerun);
	} else {
		if (this.errorcount > 0) reject(this.errorcount);
		else resolve(this.nextid);
	}
};

//
// Scheduler.run - start the sheduler
//
// returns a Promise so tasks can start their own child schedulers and wait on them
//

Scheduler.prototype.run = function run() {
	return new Promise(this.rerun.bind(this));
};

module.exports = Scheduler;
