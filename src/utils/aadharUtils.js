import { ethers } from "ethers";
export const getAadharHash = (aadharNumber) => {
    return ethers.utils.id(aadharNumber.toString());
};