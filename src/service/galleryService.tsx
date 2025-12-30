import axios from "axios";
import * as Config from "../Utils/config"; 

export const getPublicSocialPostsApi = async (data) => {
  try {
    const res = await axios.get(
      `${Config.base_url}integration/social/get-public-posts?&start=${
        data?.start
      }&length=${data?.length}&keyword=${data?.keyword}&platform=${
        data?.platform
      }&date_filter=${
        data?.date_filter == "all" ? "" : data?.date_filter
      }&uid=31588`
    );
    return res?.data;
  } catch (err) {
    return err;
  }
};
