import { init, fetchQuery } from "@airstack/node";
import { config } from "dotenv";
import fetch from "node-fetch";
import sharp from "sharp";
import fs from "node:fs";

config();

init(process.env.AIRSTACK_API_KEY as string);

const query = /* GraphQL */ `
  query MyQuery {
    MoxieFanTokens(
      input: {
        blockchain: ALL
        limit: 200
        filter: { uniqueHolders: { _gte: "0" } }
      }
    ) {
      MoxieFanToken {
        fanTokenSymbol
        fanTokenName
        socials {
          profileImageContentValue {
            image {
              small
            }
          }
        }
        channel {
          imageUrl
        }
      }
    }
  }
`;

(async () => {
  try {
    const { data, error } = await fetchQuery(query);
    if (error) {
      throw new Error(error);
    }

    for (const token of data.MoxieFanTokens.MoxieFanToken) {
      let name: string;
      let type: string;
      let imageUrl: string;
      const symbol = token?.fanTokenSymbol;

      if (symbol?.startsWith("fid:")) {
        name = token?.fanTokenName;
        type = "profiles";
        imageUrl = token?.socials?.[0]?.profileImageContentValue?.image?.small;
      } else if (symbol?.startsWith("cid:")) {
        name = symbol.split(":")[1];
        type = "farcaster-channels";
        imageUrl = token?.channel?.imageUrl;
      }

      console.log(name, type, imageUrl);

      if (imageUrl) {
        // download image
        const res = await fetch(imageUrl);
        const buffer = await res.buffer();
        console.log(buffer);
        // resize image
        const resizedImage = await sharp(buffer).resize(256, 256).toBuffer();
        // create directory
        await fs.promises.mkdir(`./${type}/${name}`, { recursive: true });
        // save image
        await sharp(resizedImage).toFile(`./${type}/${name}/logo.jpg`);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();
