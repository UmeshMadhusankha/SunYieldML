'use strict';
class CircuitBreaker {
  constructor({threshold=5,cooldownMs=30000,clock=Date.now}={}) {this.threshold=threshold;this.cooldownMs=cooldownMs;this.clock=clock;this.state='closed';this.failures=0;this.openedAt=0;this.probe=false;}
  async execute(operation) {
    if(this.state==='open') {if(this.clock()-this.openedAt<this.cooldownMs)throw Object.assign(new Error('Circuit is open'),{status:503});this.state='half-open';}
    if(this.state==='half-open'&&this.probe)throw Object.assign(new Error('Circuit recovery probe in progress'),{status:503});
    if(this.state==='half-open')this.probe=true;
    try {const value=await operation();this.state='closed';this.failures=0;return value;}
    catch(error) {if(error.retryable!==false){this.failures++;if(this.state==='half-open'||this.failures>=this.threshold){this.state='open';this.openedAt=this.clock();}}else if(this.state==='half-open'){this.state='closed';this.failures=0;}throw error;}
    finally {this.probe=false;}
  }
}
module.exports={CircuitBreaker};
