import React, {useEffect, useState} from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json';
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";
import {AnchorProvider, Program, web3} from "@project-serum/anchor";

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
    'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
    'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
    'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

const {SystemProgram, Keypair} = web3;
// creating a keypair for the account that will hold the gif data:
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");

// it controls how we want to acknowledge when a transaction is done
const opts = {
    preflightCommitment: "processed"
}

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [gifList, setGifList] = useState([]);

    const checkIfWalletIsConnected = async () => {
        try {
            const {solana} = window;
            if (solana) {
                if (solana.isPhantom) {
                    console.log("Phantom wallet found");

                    const response = await solana.connect({onlyIfTrusted: true});
                    console.log("Response public key: ", response.publicKey.toString());

                    setWalletAddress(response.publicKey.toString());
                }
            } else {
                alert("Solana object not found. Get a phantom wallet!");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const connectWallet = async () => {
    };


    const sendGif = async () => {
        if (inputValue.length === 0) {
            console.log("No gif link given!");
            return
        }
        setInputValue('');
        console.log("Gif Link: ", inputValue);
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            await program.methods.addGif(inputValue).accounts({
                baseAccount: baseAccount.publicKey,
                user: provider.wallet.publicKey,
            });
            console.log("Gif successfully sent to program: ", inputValue);

            await getGifList();
        } catch (error) {
            console.log("Error sending GIF: ", error)
        }

    }

    const onInputChange = (event) => {
        const {value} = event.target;
        setInputValue(value)
    }

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        return new AnchorProvider(connection, window.solana, opts.preflightCommitment);
    }

    const createGifAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            console.log("ping");
            await program.methods.startStuffOff().accounts({
                baseAccount: baseAccount.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId
            }).signers([baseAccount]).rpc();

            console.log("Created a new baseAccount with Address: ", baseAccount.publicKey);
            await getGifList();
        } catch (error) {
            console.log("Error creating baseAccount: ", error);
        }
    }

    const getGifList = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
            console.log("Got the account: ", account);
            setGifList(account.gifList);
            console.log("GifList: ", gifList)
        } catch (error) {
            console.log("Error in getGifList: ", error);
            setGifList(null);
        }
    }

    const renderConnectedContainer = () => {

        if (gifList === null) {
            return (
                <div className="connected-container">
                    <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                        Do One-Time Initialization for GIF Program Account.
                    </button>
                </div>
            )
        } else {
            return (
                <div className="connected-container">
                    <form onSubmit={(event) => {
                        event.preventDefault();
                        sendGif();
                    }}>
                        <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange}/>
                        <button type="submit" className="cta-button submit-gif-button">Submit</button>
                    </form>
                    <div className="gif-grid">
                        {console.log("Giflist type", gifList)}
                        {gifList.map((item, index) => (
                            <div className="gif-item" key={index}>
                                <img src={item.gifLink}/>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

    }

    const renderNotConnectedContainer = () => (
        <button
            className="cta-button connect-wallet-button"
            onClick={connectWallet}
        >
            Connect to Wallet
        </button>
    );

    useEffect(() => {
        const onLoad = async () => {
            await checkIfWalletIsConnected();
        };
        window.addEventListener('load', onLoad);
        return () => window.removeEventListener('load', onLoad);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            console.log("Fetching Gif list...");

            getGifList();
        }
    }, [walletAddress]);

    return (
        <div className="App">
            <div className={walletAddress ? 'authed-container' : 'container'}>
                <div className="header-container">
                    <p className="header">🖼 GIF Portal</p>
                    <p className="sub-text">
                        View your GIF collection in the metaverse ✨
                    </p>
                    {!walletAddress && renderNotConnectedContainer()}
                    {walletAddress && renderConnectedContainer()}
                </div>
                <div className="footer-container">
                    <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo}/>
                    <a
                        className="footer-text"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >{`built on @${TWITTER_HANDLE}`}</a>
                </div>
            </div>
        </div>
    );
};

export default App;
