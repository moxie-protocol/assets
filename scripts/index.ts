import { init, fetchQuery } from "@airstack/node";
import { config } from "dotenv";
import fetch from "node-fetch";
import sharp from "sharp";
import fs from "node:fs";
import getImgurImageSrc from "../utils/getImgurImageSrc";

config();

init(process.env.AIRSTACK_API_KEY as string);

const query = /* GraphQL */ `
  query MyQuery($cursor: String = "") {
    MoxieFanTokens(
      input: {
        blockchain: ALL
        limit: 200
        filter: { uniqueHolders: { _gte: "0" } }
        cursor: $cursor
      }
    ) {
      MoxieFanToken {
        fanTokenSymbol
        fanTokenName
        fanTokenAddress
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
      pageInfo {
        nextCursor
        hasNextPage
      }
    }
  }
`;

(async () => {
  try {
    let cursor = "";
    let allFanTokens = [];
    let page = 1;
    console.log("Fetching fan tokens...");
    while (true) {
      const { data, error } = await fetchQuery(query, { cursor });
      if (error) {
        throw new Error(error);
      }
      allFanTokens = [...allFanTokens, ...data.MoxieFanTokens.MoxieFanToken];
      console.log(`Fetched ${page++} pages...`);

      const { hasNextPage, nextCursor } = data.MoxieFanTokens.pageInfo;
      if (!hasNextPage) break;

      cursor = nextCursor;
    }

    for (const token of allFanTokens) {
      let name: string;
      let imageUrl: string;
      const symbol = token?.fanTokenSymbol;
      const address = token?.fanTokenAddress;

      if (symbol?.startsWith("fid:")) {
        name = token?.fanTokenName;
        imageUrl = token?.socials?.[0]?.profileImageContentValue?.image?.small;
      } else if (symbol?.startsWith("cid:")) {
        name = symbol.split(":")[1];
        imageUrl = token?.channel?.imageUrl;
      } else {
        // skip network tokens
        // network tokens is added manually
        continue;
      }

      // create directory
      await fs.promises.mkdir(`./fan-tokens/${address}`, { recursive: true });

      // save metadata to info.json
      await fs.promises.writeFile(
        `./fan-tokens/${address}/info.json`,
        JSON.stringify(
          {
            name,
            symbol,
            decimal: 18,
          },
          null,
          2
        )
      );

      // momentarily excludes imgur images
      if (imageUrl && !imageUrl.includes("imgur")) {
        // download image
        const res = await fetch(
          (!imageUrl.includes("imgur")
            ? imageUrl
            : await getImgurImageSrc(imageUrl)) as string
        );
        const buffer = await res.buffer();
        console.log(`Saving ${name}'s images...`, buffer);
        // resize image
        const resizedImage = await sharp(buffer).resize(256, 256).toBuffer();
        // save image
        await sharp(resizedImage).toFile(`./fan-tokens/${address}/logo.jpg`);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();
