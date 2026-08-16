import { type Address } from "viem";

import { ContractsChainId, SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "./chains";

export const CONTRACTS = {
  [SOURCE_BSC_MAINNET]: {
    DataStore: "0x92A898D6c26fB69B532c0b78aAd0cD196972dcF0",
    EventEmitter: "0xe36089503414E3c416Fb9b96d2B151530dCaA79D",
    ExchangeRouter: "0xAdBc9D0390146AEE5778629A856e8EaaEee0D559",
    SubaccountRouter: "0xAf6E4A661026c435329a79481E231162f79E6965",
    DepositVault: "0x494a39a233e4923657F4E5BD292030981bD0D648",
    WithdrawalVault: "0x9d428FFd58A1412529fd7953FA9Cf7Ab643a4449",
    OrderVault: "0xEdf8787888CE17Cb0862f5b96000E550787c3ce3",
    ShiftVault: "0x90d5271BA20708e2ae1c823017D5A7c29a5a91F4",
    SyntheticsReader: "0x7C36DaE5ea2283D96B476A9252Df50c133A8942b",
    SyntheticsRouter: "0xA3F5ee2ee8769F31FE52EcC1540499d37F92a500",
    HlvReader: "0xA771a2d9879E6A74aaFA5b84d965CdA051e31545",
    HlvRouter: "0x6ab6f80d3b281D968Df4362B1823966e7b85fDd8",
    HlvVault: "0x27B671F206b67b9223D6aF4493f88C586b3c14F7",
    MultichainClaimsRouter: "0x006D36b6C778948EC7b2Da1eC716D71e0d9a7695",
    MultichainHlvRouter: "0x51EcC61271914657B2F90215160aBEd4a4bD3437",
    MultichainOrderRouter: "0xF907Fd9E3C01efB2FD76056c54A74b79304610F8",
    MultichainSubaccountRouter: "0x93792e49c65F089d542bb2F6805b20E7f624ab86",
    MultichainTransferRouter: "0x5504A1b02A383F1Ce948a9b4D6e53915C8011902",
    MultichainVault: "0x7b405862Dd5a66D91298F2079BF36137258DE2Cf",
    LayerZeroProvider: "0xfF59459327D351D8E5FC2D5Ef49701F6e1DAC595",
    ChainlinkPriceFeedProvider: "0x720A1f0db9e5E36d085e51d331f5805B290fB458",
    ReferralStorage: "0xa682633A8CD60DF78090941D2DcdF71CDdc128ED",
    ClaimHandler: "0x8B972c84F71FDB1A0732426A3E76A9c203931218",
    ExternalHandler: "0xebc460d6409174CAEdE99314C2f1c62657039185",
    Multicall: "0x636Afe3894F6938A68ed224c7efBcd58551dA4d3",
    HFBankFactory: "0x4B92F7c04D0c50a6f02A423b7B8F2F131a53ed5D",
    CreditToken: "0x5D2e3dBd8d4bCc22AfF278A49F9B98f6D36C5927",
    CreditDistributor: "0x19B9aC92d5895c210eCe833Facb10A8306C8Ba08",
    CreditFeeClaimVault: "0x4256c38E75d27456F6d78b2fbe9271a18EBeC7AE",
    CreditProfitClaimVault: "0xDBF2B80c3d7b384fB7604B7481Af46Bb4b43Ed16",
    CreditReader: "0x7C36DaE5ea2283D96B476A9252Df50c133A8942b",
  },
  [SOURCE_BSC_TESTNET]: {
    DataStore: "0x6752eD0e1c2d3d15f4c4Ca895Db7eeB973D61253",
    EventEmitter: "0xA1e78218De6C8bcEF75DA2913a44125976186210",
    ExchangeRouter: "0xcA751994eC16c9E737D21dC0Ec08b8b1b8e2236B",
    SubaccountRouter: "0x96d0b789107B5401886f8738645fab3e05128431",
    DepositVault: "0x5432aE7F9E56FD5f20f7cc98E2Fb525C2aC181bc",
    WithdrawalVault: "0x267E6f7ceEd134364D7F4957CE50c2bDC87D7023",
    OrderVault: "0xe70b4F0eEC256fBebc95211a743F01CD5D75A731",
    ShiftVault: "0x241F3A66B24eE5cC3Ab75532fa056b3BE3d206e3",
    SyntheticsReader: "0x1662513966987520aDdd4fEd04063bd3D14F9389",
    SyntheticsRouter: "0x799dA4eb8D32522B90C1d84C40fC6a7034b47E91",
    HlvReader: "0xe037D35227e9D7F7d82419A410723039b21Dfe80",
    HlvRouter: "0x001dD1D54529d07eb51BC2D06379533e656Dd85C",
    HlvVault: "0x7E0eeb01cf5586C0912DCD04a2a0b524638c5879",
    MultichainClaimsRouter: "0xDD1Ecda0C47B172D3F64D0c2Bc74b806BCDcf452",
    MultichainHlvRouter: "0x75E71C6237fD3A02767b2f79e940Ac343f7f07F2",
    MultichainOrderRouter: "0x6222F6554E46943b9879362d66336a18D9BcD2a1",
    MultichainSubaccountRouter: "0x000fA27ee5FCD36ABEd7cf21d5C223368b73D296",
    MultichainTransferRouter: "0x01De7d6bB11A8d84625F4a9De59d10d74CCB1651",
    MultichainVault: "0xaccC74C9eE4e9798Ec4c0AC18A6064DA212DC955",
    LayerZeroProvider: "0x3Ec4Da98802aAf80b18D506C383C3Fc9420BB2d3",
    ChainlinkPriceFeedProvider: "0xa3508d026c521503D8ff2D9b34F5aC5137622C96",
    ReferralStorage: "0xD2f95b2E8ED850e38147C0Cbb4450A50fE84da2d",
    ClaimHandler: "0x1e5686291dA112FdD94f908E5B9ABE095Ce19cd7",
    ExternalHandler: "0xb3BDa20c8345507700DcBe85179fEc67c74744A4",
    Multicall: "0x4593844608fC57C1B4a51ba4608F9124b4F7c4c0",
    XP: "0xD6792ebE517cF0f13F9c92cfA9Fa2E256C8b82Bb",
    HFBankFactory: "0x61f54358727822E8332b0FC1D637f64cad56c031",
    CreditToken: "0x823B4FD16749c7c7316b224F23A434451e0a7976",
    CreditDistributor: "0x52e880Fc26Df166D05a1c1fbaEeeFe43d9c60576",
    CreditFeeClaimVault: "0x6C3AB565b7F1De2dDb92430a9AB88B7b35B760e2",
    CreditProfitClaimVault: "0xf91b277483C8d7570b0b8acDFE98AE39b1B98691",
    CreditReader: "0x1662513966987520aDdd4fEd04063bd3D14F9389",
  },
} as const;

type ExtractContractNames<T extends object> = {
  [K in keyof T]: keyof T[K];
}[keyof T];

export type ContractName = ExtractContractNames<typeof CONTRACTS>;

export function getContract(chainId: ContractsChainId, name: ContractName): Address {
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS];

  if (!contracts) {
    throw new Error(`Unknown chainId ${chainId}`);
  }

  if (!contracts[name]) {
    throw new Error(`Unknown contract "${name}" for chainId ${chainId}`);
  }

  return contracts[name];
}
