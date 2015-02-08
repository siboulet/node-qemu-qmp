# node-qemu-qmp
**Node.js library for connecting to QEMU Machine Protocol (QMP)**

# Example

```js
var QMP = require('qemu-qmp');

var qmp = new QMP();
qmp.connect('/tmp/qmp-sock', function(err) {
  if (err) throw err;
  console.info('QEMU version %d.%d.%d', qmp.version.qemu.major, qmp.version.qemu.minor, qmp.version.qemu.micro);

  qmp.execute('query-status', function(err, status) {
    if (err) throw err;
    console.info('Current VM status: %s', status.status);

    if (!status.running)
      this.end();

    console.info('Waiting for VM shutdown...');

    this.on('shutdown', function() {
      this.end();
    });
  });
});
```

# Commands

The execute() method is used to execute QEMU QMP commands. For a list of commands see https://raw.githubusercontent.com/qemu/qemu/master/qmp-commands.hx

To get a list of commands supported by your version of QEMU, use the "query-commands" command:

```js
qmp.execute('query-commands', function(err, commands) {
  if (err) throw err;
  console.log(commands);
});
```

# Events

The library emits all the standard net.Socket events, as well as all the QEMU QMP events. For a list of QEMU QMP events, see https://raw.githubusercontent.com/qemu/qemu/master/docs/qmp/qmp-events.txt
