import Board from "../components/sudoku/board";
import React, { useEffect, useState } from "react";
import NumbersKeyboard from "../components/sudoku/numbersKeyboard";
import Head from "next/head";
import GoBack from "../components/goBack";
import styles from "../styles/Sudoku.module.css";
import {
  useAccount,
  useConnect,
  useContract,
  useProvider,
  useSigner,
  useContractEvent,
  useNetwork,
} from "wagmi";

import networks from "../utils/networks.json";

import { sudokuCalldata } from "../zkproof/sudoku/snarkjsSudoku";

import contractAddress from "../utils/contractaddress.json";

import sudokuContractAbi from "../utils/abiFiles/Sudoku.json";

let sudokuBoolInitialTemp = [
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
  [false, false, false, false, false, false, false, false, false],
];

export default function Sudoku() {
  const [sudokuInitial, setSudokuInitial] = useState([]);
  const [sudoku, setSudoku] = useState([]);
  const [sudokuBoolInitial, setSudokuBoolInitial] = useState(
    sudokuBoolInitialTemp
  );
  const [selectedPosition, setSelectedPosition] = useState([]);

  const { data: dataAccount } = useAccount();
  const { activeChain } = useNetwork();

  const [loadingVerifyBtn, setLoadingVerifyBtn] = useState(false);
  const [loadingVerifyAndMintBtn, setLoadingVerifyAndMintBtn] = useState(false);
  const [loadingStartGameBtn, setLoadingStartGameBtn] = useState(false);

  const { data: signer } = useSigner();

  const provider = useProvider();

  const contract = useContract({
    addressOrName: contractAddress.sudokuContract,
    contractInterface: sudokuContractAbi.abi,
    signerOrProvider: signer || provider,
  });

  const contractNoSigner = useContract({
    addressOrName: contractAddress.sudokuContract,
    contractInterface: sudokuContractAbi.abi,
    signerOrProvider: provider,
  });

  const updatePosition = (number) => {
    if (selectedPosition.length > 0) {
      if (!sudokuBoolInitial[selectedPosition[0]][selectedPosition[1]]) return;
      const temp = [...sudoku];
      temp[selectedPosition[0]][selectedPosition[1]] = number;
      setSudoku(temp);
      console.log("sudoku", sudoku);
    }
  };

  const calculateProof = async () => {
    setLoadingVerifyBtn(true);
    console.log("sudokuInitial", sudokuInitial);
    console.log("sudoku", sudoku);
    let calldata = await sudokuCalldata(sudokuInitial, sudoku);

    if (!calldata) {
      setLoadingVerifyBtn(false);
      return "Invalid inputs to generate witness.";
    }

    // console.log("calldata", calldata);

    try {
      let result;
      if (
        dataAccount?.address &&
        activeChain.id.toString() === networks.selectedChain
      ) {
        result = await contract.verifySudoku(
          calldata.a,
          calldata.b,
          calldata.c,
          calldata.Input
        );
      } else {
        result = await contractNoSigner.verifySudoku(
          calldata.a,
          calldata.b,
          calldata.c,
          calldata.Input
        );
      }
      console.log("result", result);
      setLoadingVerifyBtn(false);
      alert("Verificación Exitosa");
    } catch (error) {
      setLoadingVerifyBtn(false);
      console.log(error);
      alert("Solución Incorrecta");
    }
  };

  const verifySudoku = async () => {
    console.log("Address", dataAccount?.address);
    calculateProof();
  };

  const renderVerifySudoku = () => {
    return (
      <button
        className="flex justify-center items-center disabled:cursor-not-allowed space-x-3 verify-btn text-lg font-medium rounded-md px-5 py-3 w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500"
        onClick={verifySudoku}
        disabled={loadingVerifyBtn}
      >
        {loadingVerifyBtn && <div className={styles.loader}></div>}
        <span>Verificar Sudoku</span>
      </button>
    );
  };

  const initializeBoard = async () => {
    try {
      let board;

      if (
        dataAccount?.address &&
        activeChain.id.toString() === networks.selectedChain
      ) {
        board = await contract.generateSudokuBoard(new Date().toString());
      } else {
        board = await contractNoSigner.generateSudokuBoard(
          new Date().toString()
        );
      }

      console.log("result", board);

      setSudokuInitial(board);

      let newArray = board.map((arr) => {
        return arr.slice();
      });
      setSudoku(newArray);

      const temp = [
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false, false],
      ];
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board.length; j++) {
          if (board[i][j] === 0) {
            temp[i][j] = true;
          }
        }
      }
      setSudokuBoolInitial(temp);
    } catch (error) {
      alert("Failed fetching Sudoku board");
    }
  };

  const renderNewGame = () => {
    return (
      <button
        className="flex justify-center items-center disabled:cursor-not-allowed space-x-3 verify-btn text-lg font-medium rounded-md px-5 py-3 w-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500"
        onClick={async () => {
          setLoadingStartGameBtn(true);
          await initializeBoard();
          setLoadingStartGameBtn(false);
        }}
        disabled={loadingStartGameBtn}
      >
        {loadingStartGameBtn && <div className={styles.loader}></div>}
        <span>Sudoku Nuevo</span>
      </button>
    );
  };

  const renderSudoku = () => {
    if (sudoku.length !== 0) {
      return (
        <>
          <div>
            <Board
              sudoku={sudoku}
              setSelectedPosition={(pos) => setSelectedPosition(pos)}
              selectedPosition={selectedPosition}
              sudokuBoolInitial={sudokuBoolInitial}
            />
          </div>
          <div>
            <div className="flex justify-center items-center my-10">
              {renderNewGame()}
            </div>
            <NumbersKeyboard updatePosition={updatePosition} />
            <div className="flex justify-center items-center my-10">
              {renderVerifySudoku()}
            </div>
          </div>
        </>
      );
    } else {
      return (
        <div className="flex justify-center items-center space-x-3">
          <div className={styles.loader}></div>
          <div>Loading Game</div>
        </div>
      );
    }
  };

  useEffect(() => {
    console.log("Sudoku page");

    initializeBoard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <Head>
        <title>zkSudoku</title>
        <meta name="title" content="zkSudoku" />
        <meta name="description" content="Zero Knowledge Sudoku Games" />
      </Head>
      <div className="mb-10">
        <GoBack />
      </div>
      <div className="flex">
        <div className="mx-5 mb-10 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 ">
          Sudoku
        </div>
      </div>
      <div className="flex flex-wrap gap-20 justify-center items-center text-slate-300">
        {renderSudoku()}
      </div>
      <div className="flex place-content-center mt-20 text-lg text-slate-300">
        <div className="md:w-6/12">
          <div className="text-center my-5 font-semibold">Reglas del Sudoku:</div>
          <div className="space-y-5">
            <p>
              <span className="font-semibold">Sudoku</span> (también conocido como
              &quot;Number Place&quot;) es un rompecabezas de colocación. El rompecabezas es
              más frecuentemente una cuadrícula de 9 x 9 compuesta por subgrillas de 3 x 3 (llamadas
              &quot;regiones&quot;). Algunas celdas ya contienen números, conocidos como
              &quot;determinados&quot;.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
              El objetivo es llenar las celdas vacías, colocando un número en cada una, de modo 
              que cada columna, fila y región contenga los números del 1 al 9 exactamente una vez. 
              </li>
              <li>
              Cada número en la solución, por lo tanto, ocurre solo una vez en cada una de las tres 
              &quot;direcciones&quot;, de ahí los &quot;números únicos&quot; implícitos por el nombre 
              del rompecabezas.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
