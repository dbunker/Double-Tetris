# this is a load balancer for node.js, 
# arguments: node-script port number-workers

# it can be started with a command like
# python balance.py ../node/server.js 8585 2

import sys
import os

# node-script port number-workers
script = sys.argv[1]
port = int(sys.argv[2])
workers = int(sys.argv[3])

balanceCmd = cmd = 'balance ' + str(port)
for i in range(1,workers+1):
	
	cmd = 'node ' + sys.argv[1] + ' ' + str(port+i) + ' > ' + str(port+i) + '.log &'
	print cmd
	os.system(cmd)
	
	balanceCmd += ' 127.0.0.1:' + str(port+i)

balanceCmd += ' -f'
print balanceCmd
os.system(balanceCmd)

