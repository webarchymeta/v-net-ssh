# V-NET trans- LAN ssh client

A trans- local area network windows (trans-LAN) ssh client.


## Installation

### Prerequisites

Install latest LTS version of `nodejs` and `git` version control system (see, e.g. [here](https://git-scm.com/)).

### Run

To run this code, follow these steps in a console where `git` is available (since the version of the present project depends on
some packages that are retrieved from [github](https://github.com)):

```
git clone https://github.com/webarchymeta/v-net-ssh
cd v-net-ssh
npm install
```
then
```
node .
```

## Three modes

It can be run in one of the following modes to access local LAN nodes or remote nodes in a different LAN that is linked together by a virtual tunnel supported by a pair of V-NET gateways. 

Before entering the ssh, there are a brief dialogue asking the user to enter various parameters. If the user choose to do trans-LAN access, the program will also ask the which SOCKS v5 port to use since the entry port of the said virtual tunnel uses SOCKS v5 protocol to do connection.

### ssh mode

User can not only use the IP address, port number, username and password to reach to remote node but also traditional `ssh` configuration file `config` under the `.ssh` sub-directory of the user's home directory to do the same, just input the name of the configuration when the `host` parameter is asked and any other relevant parameters will be automatically filled out.

### sftp mode

One can use it to transfer files between connected nodes. However, it is quite limited in features at present.

### x11 mode

Remote X programs can also be run in the present mode. However since this mode of operation is out of favor, the Linux GUI systems of the present day disables tcp connection to x-server by default. To use the current feature:

* Edit `/etc/X11/xinit/xserverrc`, remove `-nolisten tcp` parameter
* Enable tcp connection on the x-server node

  * for **ubuntu**: edit the `/etc/lightdm/lightdm.conf` file and add
```
    [SeatDefaults]
      xserver-allow-tcp=true
```

* On the x-server node execute `xhost +hostname` where hostname is the ip or the host name of the node on which this program run (`localhost`, most likely).

## License

MIT