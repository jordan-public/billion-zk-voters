/* global BigInt */
import React from 'react';
import { VStack, Box, Text, Flex, InputGroup, Input, InputLeftAddon, List, ListItem } from '@chakra-ui/react';
import { ethers } from 'ethers';
import aAggregateCounts from '../artifacts/AggregateCounts.json';

const Body = ({provider}) => {
    const [blockNumber, setBlockNumber] = React.useState(0);
    const [cAggregateCounts, setCAggregateCounts] = React.useState(null);
    const [issue, setIssue] = React.useState('To be or not to be?|Not to be.|To be.');
    const [issueHash, setIssueHash] = React.useState(null);
    const [title, setTitle] = React.useState('');
    const [options, setOptions] = React.useState([]);
    const [votes, setVotes] = React.useState([]);

    React.useEffect(() => {
console.log("reading votes ...");
        (async () => {
            if (!cAggregateCounts) { console.log("no contract instantiated"); return; }
            if (options.length === 0) { console.log("no options"); return; }
            if (!issueHash) { console.log("no issueHash"); return; }
            try {
                let v = [];
                for (let i = 0; i < options.length; i++) {
                    const toSign = issue + i.toString();
                    const candidateHash = ethers.keccak256(ethers.toUtf8Bytes('\x19Ethereum Signed Message:\n' + toSign.length.toString() + toSign));
                    v.push(await cAggregateCounts.getVoteCount(BigInt(issueHash), BigInt(candidateHash)));
                };
                setVotes(v);
            } catch (error) {
                console.log("error: ", error);
            }
            })();
    }, [blockNumber, cAggregateCounts]);

    React.useEffect(() => {
console.log("init provider: ", provider);
        if (!provider) { console.error("provider is null"); return; }
        setCAggregateCounts(new ethers.Contract(aAggregateCounts.contractAddress, aAggregateCounts.abi, provider));
        provider.on("block", setBlockNumber);
        return () => provider.off("block", setBlockNumber);
    }, []);

    React.useEffect(() => {
console.log("init issue: (setting options)", issue);
        if (!issue) return;
        const h = ethers.keccak256(ethers.toUtf8Bytes(issue));
        setIssueHash(h);
        console.log("issueHash: ", h);
        const parts = issue.split('|');
console.log("number of options: ", parts.length - 1);
        setTitle(parts[0]);
        setOptions(parts.slice(1));
    }, [issue]);

    return (<Flex height="100vh" width="100vw" alignItems="center" justifyContent="center">
        <VStack>
        <Box>
            <InputGroup>
                <InputLeftAddon color="black" children='Issue' />
                <Input placeholder='type issue text here' value={issue} onChange={(e) => setIssue(e.target.value)}/>
            </InputGroup>
        </Box>
        <br/>
        <Box border={1} borderRadius={5} p={5} m={5}>
            <Text fontSize="2xl" color="tomato">Issue: {title}</Text>
            <List>
                {options.map((o, i) => <ListItem key={i}><Text fontSize="2xl" color="tomato">{o}: {votes && votes.length>i && votes[i].toString()}</Text></ListItem>)}
            </List>
        </Box>
        </VStack>
    </Flex>);
}

  export default Body;