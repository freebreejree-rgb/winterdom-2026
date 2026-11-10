// Rigid suspension in world units. Both ends rotate together, so the
// length cannot change with the viewing angle or the animation phase.
export function suspension(angle, length = 3.15, tilt = Math.PI / 8, radius = 2.55) {
  const outward = length * Math.sin(tilt);
  return {
    anchor: [radius * Math.cos(angle), 0, radius * Math.sin(angle)],
    end: [(radius + outward) * Math.cos(angle), -length * Math.cos(tilt), (radius + outward) * Math.sin(angle)],
    tangent: [-Math.sin(angle), 0, Math.cos(angle)],
  };
}
