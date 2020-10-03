require("dotenv").config();
const {
  renderError,
  parseBoolean,
  parseArray,
  clampValue,
  CONSTANTS,
} = require("../src/common/utils");

const renderStatsCard = require("../src/cards/stats-card");
const blacklist = require("../src/common/blacklist");

module.exports = async (req, res) => {
  const {
    hide,
    hide_title,
    hide_border,
    hide_rank,
    count_private,
    include_all_commits,
    line_height,
    theme,
    cache_seconds,
    custom_title,
  } = req.query;

  // `https://github-readme-stats.vercel.app/api?username=anuraghazra&title_color=${titleColor}&icon_color=${iconColor}&text_color=${textColor}&bg_color=${bgColor}&show_icons=true`;

  var username = 'anuraghazra';
  var title_color = '34d8eb';
  var icon_color = '34b4eb';
  var text_color = '065c03';
  var bg_color = '020c52';
  var show_icons = true;

  res.setHeader("Content-Type", "image/svg+xml");

  
    var stats = {
      name: "",
      totalPRs: 0,
      totalCommits: 0,
      totalIssues: 0,
      totalStars: 0,
      contributedTo: 0,
      rank: { level: "C", score: 0 },
    };
  
  
  try {

    const cacheSeconds = clampValue(
      parseInt(cache_seconds || CONSTANTS.TWO_HOURS, 10),
      CONSTANTS.TWO_HOURS,
      CONSTANTS.ONE_DAY,
    );

    res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);


    /*
  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    hide_rank = false,
    include_all_commits = false,
    line_height = 25,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme = "default",
    custom_title,
  } = options;
    */

    return res.send(
      renderStatsCard(stats, {
        
        // hide: parseArray(hide),
        hide: parseArray('[]'), 
        
        // show_icons: parseBoolean(show_icons),
        show_icons: parseBoolean(false),
        
        // hide_title: parseBoolean(hide_title),
        hide_title: parseBoolean(false),
        
        // hide_border: parseBoolean(hide_border),
        hide_border: parseBoolean(false),
        
        
        // hide_rank: parseBoolean(hide_rank),
        hide_rank: parseBoolean(false),
        
        // include_all_commits: parseBoolean(include_all_commits),
        include_all_commits: parseBoolean(true),
        
        line_height: 25,
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme: "default",
        custom_title: "Hello",
      }),
    );
  } catch (err) {
    return res.send(renderError(err.message, err.secondaryMessage));
  }
};
