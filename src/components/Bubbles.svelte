<script lang="ts">
  import { onMount } from 'svelte';
  import { getFirebaseUrl, handleApiResponse } from '../lib';
  import type { Audial, MusicPlatform, Song } from '../types';
  import { Geolocation, type Position } from '@capacitor/geolocation';
  // import { FIREBASE_URL } from '../store';
  let canvas: HTMLCanvasElement;
  let wrapper: HTMLDivElement;

  function hashCode(str: string, seed: number) {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  function getRelativeLuminance(rgb: [number, number, number]) {
    let [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function getContrastRatio(
    rgb1: [number, number, number],
    rgb2: [number, number, number]
  ) {
    let l1 = getRelativeLuminance(rgb1);
    let l2 = getRelativeLuminance(rgb2);
    return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
  }

  function intToRGB(i: number) {
    let c = (i & 0x00ffffff).toString(16).toUpperCase();
    let hex = '#' + '00000'.substring(0, 6 - c.length) + c;
    let rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16)) as [
      number,
      number,
      number
    ];
    let contrast = getContrastRatio(rgb, [31, 41, 55]);
    while (contrast < 4.5) {
      i++;
      c = (i & 0x00ffffff).toString(16).toUpperCase();
      hex = '#' + '00000'.substring(0, 6 - c.length) + c;
      rgb = hex.match(/.{2}/g).map((v) => parseInt(v, 16)) as [
        number,
        number,
        number
      ];
      contrast = getContrastRatio(rgb, [31, 41, 55]);
    }
    return hex;
  }

  onMount(async () => {
    let location: Position;
    try {
      await Geolocation.checkPermissions().catch(
        async () => await Geolocation.requestPermissions()
      );
      location = await Geolocation.getCurrentPosition();
    } catch (e) {
      console.log('Location permissions rejected.');
    }
    const res = await fetch(getFirebaseUrl('nearbySubmissions'), {
      method: 'post',
      body: JSON.stringify({
        location: {
          latitude: location ? location.coords.latitude : 0,
          longitude: location ? location.coords.longitude : 0,
        },
      }),
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to set new music platform
      return false;
    }
    const data = json.message as {
      song: Song;
      audial: Audial;
      user: { username: string; id: string; musicPlatform: MusicPlatform };
    }[];
    // handle data
    let genres = data.map((item) => item.song.genre);
    let uniqueGenres = [...new Set(genres)];
    let genreCounts = uniqueGenres.map(
      (genre) => genres.filter((item) => item === genre).length
    );
    let maxCount = Math.max(...genreCounts);
    let minCount = Math.min(...genreCounts);
    let maxSize = 30;
    let minSize = 10;
    let sizes = genreCounts.map((count) => {
      if (maxCount === minCount) {
        return (maxSize + minSize) / 2;
      } else {
        return (
          ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize) +
          minSize
        );
      }
    });
    console.log(sizes);
    // set canvas w/h
    const width = wrapper.getBoundingClientRect().width;
    const height = wrapper.getBoundingClientRect().height;
    canvas.width = width;
    canvas.height = height;

    // ellipse creation and canvas init.
    let ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let sortedGenres = uniqueGenres
      .map((genre, i) => ({ genre, size: sizes[i] }))
      .sort((a, b) => b.size - a.size)
      .map((item) => item.genre);

    let positions = [];
    for (let i = 0; i < sortedGenres.length; i++) {
      let index = uniqueGenres.indexOf(sortedGenres[i]);
      let x: number, y: number;
      let isValid = false;
      while (!isValid) {
        x =
          Math.random() *
          (canvas.width - (sizes[index] / 3) * sortedGenres[i].length * 2);
        y = Math.random() * (canvas.height - sizes[index] * 2);
        isValid = true;
        for (let j = 0; j < positions.length; j++) {
          let dx =
            x +
            sizes[index] / 2 -
            (positions[j].x + sizes[positions[j].index] / 2);
          let dy =
            y +
            sizes[index] / 2 -
            (positions[j].y + sizes[positions[j].index] / 2);
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < (sizes[index] + sizes[positions[j].index]) / 1) {
            isValid = false;
            break;
          }
        }
      }
      positions.push({ x, y, index });
      ctx.beginPath();
      ctx.fillStyle = intToRGB(hashCode(sortedGenres[i], 210));
      ctx.ellipse(
        x + sizes[index] / 2,
        y + sizes[index] / 2,
        (sizes[index] / 4) * sortedGenres[i].length,
        sizes[index],
        0,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = `${sizes[index] * 0.55}px League Spartan`;
      ctx.fillText(sortedGenres[i], x + sizes[index] / 2, y + sizes[index] / 2);
    }
  });
</script>

<div bind:this={wrapper} class="w-full h-28">
  <canvas bind:this={canvas} />
</div>
