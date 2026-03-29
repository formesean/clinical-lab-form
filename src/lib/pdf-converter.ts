import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs";
import ILovePDFFile from "@ilovepdf/ilovepdf-nodejs/ILovePDFFile";

export class QuotaExhaustedException extends Error {
  constructor() {
    super("All ILovePDF accounts have exhausted their quota");
    this.name = "QuotaExhaustedException";
  }
}

function loadAccounts(): { publicKey: string; secretKey: string }[] {
  const accounts: { publicKey: string; secretKey: string }[] = [];
  let n = 1;
  while (true) {
    const publicKey = process.env[`ILOVEPDF_KEY_${n}_PUBLIC`];
    const secretKey = process.env[`ILOVEPDF_KEY_${n}_SECRET`];
    if (!publicKey || !secretKey) break;
    accounts.push({ publicKey, secretKey });
    n += 1;
  }
  return accounts;
}

function isQuotaError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message.toLowerCase()
      : String(err).toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("402") ||
    msg.includes("limit") ||
    msg.includes("remaining_files")
  );
}

async function convertWithAccount(
  credentials: { publicKey: string; secretKey: string },
  xlsmBuffer: Buffer,
  filename: string,
): Promise<Buffer> {
  const instance = new ILovePDFApi(
    credentials.publicKey,
    credentials.secretKey,
  );
  const task = instance.newTask("officepdf");
  const sourceFile = ILovePDFFile.fromArray(xlsmBuffer, filename);

  await task.start();
  await task.addFile(sourceFile);
  await task.process();
  const data = await task.download();
  return Buffer.from(data);
}

export async function convertXlsmToPdf(
  xlsmBuffer: Buffer,
  filename: string,
): Promise<Buffer> {
  const accounts = loadAccounts();
  if (accounts.length === 0) {
    throw new QuotaExhaustedException();
  }

  for (const account of accounts) {
    try {
      return await convertWithAccount(account, xlsmBuffer, filename);
    } catch (err) {
      if (isQuotaError(err)) {
        continue;
      }
      throw err;
    }
  }

  throw new QuotaExhaustedException();
}
