const {
  kFormatter,
  getCardColors,
  FlexLayout,
  encodeHTML,
} = require("../common/utils");
const { getStyles } = require("../getStyles");
const Card = require("../common/Card");

const createTextNode = ({
  icon,
  label,
  value,
  index,
}) => {
  const kValue = kFormatter(value);
  const staggerDelay = (index + 3) * 150;


  const labelOffset = `x="25"`;
  var iconSvg;

  // #ff4757
  if (icon == 'broken_document') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" data-testid="icon" fill="#ed2d47" stroke="none" class="icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="none" stroke="none" d="M0 0h24v24H0z"/>
        <path d="M20 22H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1zM8 7v2h8V7H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z"/>
      </svg>
    `;
  }

  // #ff4757
  else if (icon == 'broken_snippet') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" data-testid="icon" class="icon" stroke="#ff4757" fill="#ff4757" fill-opacity="0.5" viewBox="0 0 24 24" width="16" height="16">
        <path fill="none" stroke="none" d="M0 0h24v24H0z"/>
        <path d="M9.446 8.032L12 10.586l6.728-6.728a2 2 0 0 1 2.828 0l-12.11 12.11a4 4 0 1 1-1.414-1.414L10.586 12 8.032 9.446a4 4 0 1 1 1.414-1.414zm5.38 5.38l6.73 6.73a2 2 0 0 1-2.828 0l-5.317-5.316 1.415-1.415zm-7.412 3.174a2 2 0 1 0-2.828 2.828 2 2 0 0 0 2.828-2.828zm0-9.172a2 2 0 1 0-2.828-2.828 2 2 0 0 0 2.828 2.828z"/>
      </svg>
    `;
  }

  // #ff4757
  else if (icon == 'check') {
    iconSvg =  `
      <svg xmlns="http://www.w3.org/2000/svg" data-testid="icon" fill="#ff4757" class="icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M15.874 13a4.002 4.002 0 0 1-7.748 0H3v-2h5.126a4.002 4.002 0 0 1 7.748 0H21v2h-5.126zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
      </svg>
    `
  }

  /*
  <RiFileList2Fill  style = {{
                                color: '#2684FF',
                                width: "2rem",
                                fontSize: "1.6rem",
                                marginRight: "0.5rem"
                            }}/>
  */

    
  else if (icon == 'document') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" data-testid="icon" fill="#2684FF" class="icon" viewBox="0 0 24 24" width="16" height="16">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M20 22H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1zM8 7v2h8V7H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z"/>
      </svg>
    `;
  }

  // RiScissorsLine
  else if (icon == 'snippet') {
    iconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" data-testid="icon" class="icon" viewBox="0 0 24 24" width="16" height="16" fill="#24292e">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M9.446 8.032L12 10.586l6.728-6.728a2 2 0 0 1 2.828 0l-12.11 12.11a4 4 0 1 1-1.414-1.414L10.586 12 8.032 9.446a4 4 0 1 1 1.414-1.414zm5.38 5.38l6.73 6.73a2 2 0 0 1-2.828 0l-5.317-5.316 1.415-1.415zm-7.412 3.174a2 2 0 1 0-2.828 2.828 2 2 0 0 0 2.828-2.828zm0-9.172a2 2 0 1 0-2.828-2.828 2 2 0 0 0 2.828 2.828z"/>
      </svg>
    `;
  }


  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      ${iconSvg}
      <text class="stat bold" ${labelOffset} y="12.5">${label}:</text>
      <text 
        class="stat" 
        x="${220}" 
        y="12.5" 
      >${kValue}</text>
    </g>
  `;
};

const renderStatsCard = (stats = {}, options = { hide: [] }) => {
  const {
    name,
    totalDocuments,
    brokenDocuments,
    totalSnippets,
    brokenSnippets,
    unresolvedChecks,
    rank,
  } = stats;
  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    hide_rank = false,
    line_height = 25,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme = "graywhite",
    custom_title,
  } = options;

  const lheight = parseInt(line_height, 10);

  // returns theme based colors with proper overrides and defaults
  const { titleColor, textColor, iconColor, bgColor } = getCardColors({
    undefined, // title_color,
    undefined, // icon_color,
    undefined, // text_color,
    undefined, // bg_color,
    theme,
  });

  // Meta data for creating text nodes with createTextNode function
  const STATS = {
    invalid_documents: {
      icon: "broken_document",
      label: "Invalid Documents",
      value: brokenDocuments,
    },
    invalid_snippets: {
      icon: "broken_snippet",
      label: "Invalid Snippets",
      value: brokenSnippets,
    },
    invalid_checks: {
      icon: "check",
      label: "Invalid Checks",
      value: unresolvedChecks,
    },
    all_documents: {
      icon: "document",
      label: `Total Documents`,
      value: totalDocuments,
    },
    all_snippets: {
      icon: "snippet", // RiScissorsLine,
      label: "Total Snippets",
      value: totalSnippets,
    },
  };

  // filter out hidden stats defined by user & create the text nodes
  const statItems = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key, index) =>
      // create the text nodes, and pass index so that we can calculate the line spacing
      createTextNode({
        ...STATS[key],
        index,
      }),
    );

  // Calculate the card height depending on how many items there are
  // but if rank circle is visible clamp the minimum height to `150`
  let height = Math.max(
    45 + (statItems.length + 1) * lheight,
    hide_rank ? 0 : 150,
  );

  // Conditionally rendered elements
  const rankCircle = hide_rank
    ? ""
    : `<g data-testid="rank-circle" 
          transform="translate(400, ${height / 2 - 50})">
        <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
        <circle class="rank-circle" cx="-10" cy="8" r="40" />
        <g class="rank-text">
          <text
            x="${rank.level.length === 1 ? "-4" : "0"}"
            y="0"
            alignment-baseline="central"
            dominant-baseline="central"
            text-anchor="middle"
          >
            ${rank.level}
          </text>
        </g>
      </g>`;

  // the better user's score the the rank will be closer to zero so
  // subtracting 100 to get the progress in 100%
  const progress = 100 - rank.score;
  const cssStyles = getStyles({
    titleColor,
    textColor,
    show_icons,
    progress,
  });

  const apostrophe = ["x", "s"].includes(name.slice(-1)) ? "" : "s";
  const card = new Card({
    customTitle: custom_title,
    defaultTitle: `${encodeHTML(name)}'${apostrophe} GitHub Stats`,
    width: 495,
    height,
    colors: {
      titleColor,
      textColor,
      iconColor,
      bgColor,
    },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);

  return card.render(`
    ${rankCircle}

    <svg x="0" y="0">
      ${FlexLayout({
        items: statItems,
        gap: lheight,
        direction: "column",
      }).join("")}
    </svg> 
  `);
};

module.exports = renderStatsCard;
