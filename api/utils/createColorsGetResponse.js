const createColorsGetResponse = colors => {
  return {
    type: 'horizontal column',
    title: {
      position: 'center',
      label: {
        text: '<span style="font-size: 24px">Total data for top 100 most popular user colors on twitch.tv</span>',
      },
    },
    palette: colors.map(i => i.color),
    legend: {
      layout: 'vertical',
      position: 'inside top right',
      customEntries: colors.map(i => {
        const colorName = i.color.replace('gray', 'no color');
        return {
          name: colorName,
          icon: 'none',
          value: String(i.count),
        };
      }),
    },
    defaultPoint: {
      tooltip: '<span style="color:%color"></span><b>%value %name</b>',
    },
    series: [
      {
        points: colors.map(i => {
          const colorName = i.color.replace('gray', 'no color');
          return {
            name: colorName,
            color: i.color,
            x: colorName,
            y: Number(i.count),
          };
        }),
      },
    ],
  };
};

module.exports = createColorsGetResponse;
