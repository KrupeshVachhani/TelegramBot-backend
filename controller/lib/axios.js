const axios = require("axios");

const baseUrl = `https://api.telegram.org/bot7128826663:AAEkLIkR5beeWJkwRMdg4_hlLHAi3NTPcTA`;

function getAxiosInstance() {
  return {
    get(method, params) {
      return axios.get(`/${method}`, {
        baseURL: baseUrl,
        params,
      });
    },
    post(method, data) {
      return axios({
        method: "post",
        baseURL: baseUrl,
        url: `/${method}`,
        data,
      });
    },
  };
}

module.exports = {
  axiosInstance: getAxiosInstance(),
};