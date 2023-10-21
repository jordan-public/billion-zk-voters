import React from 'react';
import {
    ChakraProvider,
    Box,
    Text,
    Link,
    VStack,
    Code,
    Grid,
    InputGroup,
    Input,
    InputLeftAddon,
    List,
    ListItem,
    theme,
  } from '@chakra-ui/react';
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
        if (!provider) return;
        setCAggregateCounts(new ethers.Contract(aAggregateCounts.contractAddress, aAggregateCounts.abi, provider));
    }, [provider]);

    React.useEffect(() => {
        (async () => {
console.log("cAggregateCounts: ", cAggregateCounts);
            if (!cAggregateCounts) return;
            if (options.length === 0) return;
            if (!issueHash) return;
            try {
                let v = [];
                for (let i = 0; i < options.length; i++) {
                    candidateHash = ethers.keccak256(ethers.toUtf8Bytes(topic + i.toString()));
                    v.push(await cAggregateCounts.getVoteCount(issueHash, candidateHash));
                };
                setVotes(v);
            } catch (error) {
                console.log("error: ", error);
            }
            })();
    }, [blockNumber]);

    React.useEffect(() => {
        if (provider) {
            provider.on("block", setBlockNumber);
            return () => provider.off("block", setBlockNumber);
        }
    }, [provider]);

    React.useEffect(() => {
        if (!issue) return;
        const h = ethers.keccak256(ethers.toUtf8Bytes(issue));
        setIssueHash(h);
        console.log("issueHash: ", h);
        const parts = issue.split('|');
        setTitle(parts[0]);
        setOptions(parts.slice(1));
    }, [issue]);

    return (<VStack spacing={8}>
        <Box>
            <InputGroup>
                <InputLeftAddon color="black" children='Issue' />
                <Input placeholder='type issue text here' value={issue} onChange={(e) => setIssue(e.target.value)}/>
            </InputGroup>
        </Box>
        <Box justifySelf>
            <Text fontSize="6xl" color="tomato">Issue: {title}</Text>
            <List>
                {options.map((o, i) => <ListItem key={i}><Text fontSize="6xl" color="tomato">{o}: {votes && votes[i] && votes[i]}</Text></ListItem>)}
            </List>
            <Text fontSize="6xl" color="tomato">Block number: {blockNumber}</Text>
        </Box>
    </VStack>);
}

  export default Body;