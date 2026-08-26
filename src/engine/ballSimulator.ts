import { Unit, BoardState, Position, BattleLog, SimulationResult, BoardBounds, BOARD_CONFIG } from '../types/index.js';
import { AbilityTrigger, deriveAbilities, resolveAbilityAttack } from './abilities.js';

const MAX_TICKS = 800;

/**
 * Ball-mode simulator: units are balls that roam the field,
 * hit a target ONCE, then immediately switch to a different target.
 */
export class BallBattleSimulator {
  private units: Map<string, Unit> = new Map();
  private battleLog: BattleLog = [];
  private tick: number = 0;
  /** Tracks which target each unit just hit — they must pick someone else next. */
  private lastHitTarget: Map<string, string> = new Map();

  /**
   * Board bounds in tiles. Supplied by the caller because the grid is shaped to
   * the selected export format — a 9:16 board is tall, a 16:9 board is wide.
   */
  private readonly bounds: BoardBounds;

  constructor(bounds: BoardBounds = BOARD_CONFIG) {
    this.bounds = bounds;
  }

  /**
   * Keep a unit on the board. Clamps to `size - 1` because a unit is drawn as a
   * one-tile box whose top-left is its position, so `size - 1` is the last
   * position whose box still fits.
   */
  private clampToBoard(unit: Unit): void {
    unit.x = Math.max(0, Math.min(this.bounds.width - 1, unit.x));
    unit.y = Math.max(0, Math.min(this.bounds.height - 1, unit.y));
  }

  private cloneUnit(unit: Unit): Unit {
    return {
      ...unit,
      abilities: unit.abilities ?? deriveAbilities(unit),
      spentAbilities: [],
    };
  }

  private initializeBoard(state: BoardState): void {
    this.units.clear();
    this.battleLog = [];
    this.tick = 0;
    this.lastHitTarget.clear();

    for (const unit of state.units) {
      this.units.set(unit.id, this.cloneUnit(unit));
    }
  }

  private getAliveUnits(): Unit[] {
    return Array.from(this.units.values()).filter(u => u.hp > 0);
  }

  private getDistance(a: Position, b: Position): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  private findTarget(unit: Unit): Unit | null {
    const lastId = this.lastHitTarget.get(unit.id);
    const others = this.getAliveUnits().filter(u => u.id !== unit.id);
    if (others.length === 0) return null;

    // Prefer targets that aren't the last one we hit
    let candidates = others.filter(u => u.id !== lastId);
    // If the only target left is the one we just hit, allow it
    if (candidates.length === 0) candidates = others;

    // Pick the nearest candidate
    let nearest = candidates[0];
    let minDist = this.getDistance(unit, nearest);

    for (const other of candidates) {
      const dist = this.getDistance(unit, other);
      if (dist < minDist) {
        minDist = dist;
        nearest = other;
      }
    }

    return nearest;
  }

  private isInRange(attacker: Unit, target: Unit): boolean {
    const distance = this.getDistance(attacker, target);
    return distance <= attacker.range + 0.5;
  }

  private moveTowards(unit: Unit, target: Unit): void {
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const speed = 0.45; // faster than original — balls move quickly
      const moveDist = Math.min(speed, dist);
      const newX = unit.x + (dx / dist) * moveDist;
      const newY = unit.y + (dy / dist) * moveDist;

      unit.x = newX;
      unit.y = newY;
      this.clampToBoard(unit);

      this.logMove(unit, { x: unit.x, y: unit.y });
    }
  }

  private applySeparation(): void {
    const units = this.getAliveUnits();
    const SEPARATION_RADIUS = 0.7;
    const REPULSION_FORCE = 0.35;

    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const u1 = units[i];
        const u2 = units[j];
        const dx = u1.x - u2.x;
        const dy = u1.y - u2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SEPARATION_RADIUS && dist > 0) {
          const overlap = SEPARATION_RADIUS - dist;
          const forceX = (dx / dist) * overlap * REPULSION_FORCE;
          const forceY = (dy / dist) * overlap * REPULSION_FORCE;

          u1.x += forceX;
          u1.y += forceY;
          u2.x -= forceX;
          u2.y -= forceY;

          this.clampToBoard(u1);
          this.clampToBoard(u2);

          this.logMove(u1, { x: u1.x, y: u1.y });
          this.logMove(u2, { x: u2.x, y: u2.y });
        }
      }
    }
  }

  private attack(attacker: Unit, target: Unit): void {
    const damageValues = [0, 1, 3];
    const baseDamage = damageValues[Math.floor(Math.random() * damageValues.length)];

    const outcome = resolveAbilityAttack(attacker, target, baseDamage);

    this.logAttack(attacker, target, outcome.damage);
    target.hp -= outcome.damage;
    if (target.hp <= 0) {
      target.hp = 0;
      this.logDeath(target);
    }
    for (const trigger of outcome.triggers) {
      this.logAbility(trigger);
    }

    // Record that we just hit this target — next tick we'll pick someone else
    this.lastHitTarget.set(attacker.id, target.id);

    // Short cooldown so there's a brief pause before chasing next target.
    // BLITZ skips it entirely for an instant follow-up.
    attacker.cooldown = outcome.blitz ? 0 : 600 / attacker.attackSpeed;
  }

  private processUnit(unit: Unit, hitThisTick: Set<string>): void {
    if (unit.hp <= 0) return;
    if (unit.cooldown > 0) return;

    const target = this.findTarget(unit);
    if (!target) return;

    if (this.isInRange(unit, target)) {
      if (hitThisTick.has(target.id)) return;
      hitThisTick.add(target.id);
      this.attack(unit, target);
    } else {
      this.moveTowards(unit, target);
    }
  }

  private log(event: any) {
    this.battleLog.push({ tick: this.tick, ...event });
  }

  private logMove(unit: Unit, newPosition: Position) {
    this.log({ type: 'move', unitId: unit.id, to: newPosition });
  }

  private logAttack(attacker: Unit, target: Unit, damage: number) {
    this.log({ type: 'attack', attackerId: attacker.id, targetId: target.id, damage });
  }

  private logDeath(unit: Unit) {
    this.log({ type: 'death', unitId: unit.id });
  }

  private logAbility(trigger: AbilityTrigger) {
    this.log({ type: 'ability', ...trigger });
  }

  private checkWinner(): string | 'draw' | null {
    const aliveUnits = this.getAliveUnits();
    if (aliveUnits.length === 1) return aliveUnits[0].id;
    if (aliveUnits.length === 0) return 'draw';
    return null;
  }

  public runSimulation(state: BoardState): SimulationResult {
    this.initializeBoard(state);

    const timeStep = 100;

    while (this.tick < MAX_TICKS * 100) {
      const winner = this.checkWinner();
      if (winner) {
        return { winner, battleLog: this.battleLog };
      }

      const allUnits = this.getAliveUnits();

      for (const unit of allUnits) {
        if (unit.cooldown > 0) {
          unit.cooldown -= timeStep;
        }
      }

      const hitThisTick = new Set<string>();
      for (const unit of allUnits) {
        this.processUnit(unit, hitThisTick);
      }

      this.applySeparation();

      this.tick += timeStep;
    }

    const alive = this.getAliveUnits();
    if (alive.length === 1) return { winner: alive[0].id, battleLog: this.battleLog };
    return { winner: 'draw', battleLog: this.battleLog };
  }
}
