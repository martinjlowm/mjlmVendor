/**
 * @noSelfInFile
 */

const f = CreateFrame('Frame', null, UIParent)

const whitelist: { [itemId: string]: boolean } = {

  /* Big Bear Meat */ '3730': true,
  /* Boar Intestines */ '3172': true,
  /* Boar Ribs */ '2677': true,
  /* Breath of Wind */ '7081': true,
  /* Crawler Claw */ '2675': true,
  /* Crawler Meat */ '2674': true,
  /* Crisp Spider Meat */ '1081': true,
  /* Crocolisk Meat */ '2924': true,
  /* Deviate Scale */ '6470': true,
  /* Flask of Big Mojo */ '8152': true,
  /* Giant Clam Meat */ '4655': true,
  /* Gooey Spider Leg */ '2251': true,
  /* Heavy Hide */ '4235': true,
  /* Heavy Kodo Meat */ '12204': true,
  /* Heavy Leather */ '4234': true,
  /* Heavy Scorpid Scale */ '15408': true,
  /* Khadgar's Whisker */ '3358': true,
  /* Kodo Meat */ '5467': true,
  /* Large Fang */ '5637': true,
  /* Lean Wolf Flang */ '1015': true,
  /* Light Hide */ '783': true,
  /* Light Leather */ '2318': true,
  /* Lion Meat */ '3731': true,
  /* Medium Hide */ '4232': true,
  /* Medium Leather */ '2319': true,
  /* Murloc Eye */ '730': true,
  /* Murloc Fin */ '1468': true,
  /* Mysery Meat */ '12037': true,
  /* Naga Scale */ '7072': true,
  /* Nightcrawlers */ '6530': true,
  /* Raptor Egg */ '3685': true,
  /* Raptor Flesh */ '12184': true,
  /* Raptor Hide */ '4461': true,
  /* Red Wolf Meat */ '12203': true,
  /* Ruined Leather Scraps */ '2934': true,
  /* Scorpid Scale */ '8154': true,
  /* Scorpid Stinger */ '5466': true,
  /* Sharp Claw */ '5635': true,
  /* Slimy Murloc Scale */ '5784': true,
  /* Small Spider Leg */ '5465': true,
  /* Small Venom Sac */ '1475': true,
  /* Spider Ichor */ '3174': true,
  /* Spider's Silk */ '3182': true,
  /* Stag Meat */ '5471': true,
  /* Strider Meat */ '5469': true,
  /* Tangy Clam Meat */ '5504': true,
  /* Tender Crab Meat */ '12206': true,
  /* Thick Hide */ '8169': true,
  /* Thick Leather */ '4304': true,
  /* Thick Murloc Scale */ '5785': true,
  /* Thick Spider's Silk */ '4337': true,
  /* Tiger Meat */ '12202': true,
  /* Turtle Meat */ '3712': true,
  /* Volatile Rum */ '9260': true,
  /* White Spider Meat */ '12205': true,

};

function sellItems() {
  if (!MerchantFrame.IsShown()) {
    return;
  }

  for (let bag = 0; bag <= NUM_BAG_SLOTS; bag++) {
    for (let slot = 0; slot <= GetContainerNumSlots(bag); slot++) {
      const itemLink = GetContainerItemLink(bag, slot);

      if (itemLink) {
        const [, , itemId] = string.find(itemLink, 'item:(%d+)');
        const [, , rarity, , , , subType] = GetItemInfo(itemLink);

        let unusableItem: boolean;
        let commonEquippableItem = rarity === 1 && IsEquippableItem(itemLink);

        if (commonEquippableItem) {
          GameTooltip.SetOwner(UIParent, 'ANCHOR_NONE');
          GameTooltip.SetHyperlink(itemLink);
          GameTooltip.Show();

          let tooltipText: WoWAPI.FontInstance;
          for (let line = 1; line < GameTooltip.NumLines(); line++) {
            tooltipText = _G[`GameTooltipTextRight${line}`];
            if (tooltipText) {
              const text = tooltipText.GetText();

              if (text && string.find(subType, text)[0]) {
                const [r, g, b] = tooltipText.GetTextColor();

                if (r > .9 && b < .13 && g < .13) {
                  unusableItem = true;
                }
              }
            }
          }
        }

        if (rarity === 0 || unusableItem || whitelist[itemId]) {
          UseContainerItem(bag, slot);
        }
      }
    }
  }
}

f.MERCHANT_SHOW = function(this: typeof f) {
  const [, canRepair] = GetRepairAllCost();

  if (canRepair) {
    RepairAllItems();
  }

  sellItems();
};

f.MODIFIER_STATE_CHANGED = function(this: typeof f, _event: string, key: string, state: number) {
  if (key === 'LCTRL' && state === 1) {
    let lastPrice: number;
    let bagNum: number;
    let slotNum: number;
    for (let bag = 0; bag < NUM_BAG_SLOTS; bag++) {
      if (IsBagOpen(bag)) {
	for (let bagSlot = 1; bagSlot <= GetContainerNumSlots(bag); bagSlot++) {
          const itemid = GetContainerItemID(bag, bagSlot);
	  if (itemid) {
	    const [, , itemRarity, , , , , , , , vendorPrice] = GetItemInfo(itemid);
	    if (itemRarity <= 1 && vendorPrice > 0) {
	      const [, itemCount] = GetContainerItemInfo(bag, bagSlot);
	      const totalVendorPrice = vendorPrice * itemCount;
	      if (!lastPrice) {
	        lastPrice = totalVendorPrice;
	        bagNum = bag;
	        slotNum = bagSlot;
	      } else if (lastPrice > totalVendorPrice) {
	        lastPrice = totalVendorPrice
	        bagNum = bag
	        slotNum = bagSlot
	      }
            }
          }
        }
      }
    }

    if (bagNum && slotNum) {
      for (let i = 1; i <= NUM_CONTAINER_FRAMES; i++) {
        const frame = _G[`ContainerFrame${i}`];
        if (frame.GetID() === bagNum && frame.IsShown()) {
          const item = _G[`ContainerFrame${i}Item${GetContainerNumSlots(bagNum) + 1 - slotNum}`];
          if (item) {
            item.NewItemTexture.SetAtlas('bags-glow-orange');
	    item.NewItemTexture.Show();
	    item.flashAnim.Play();
	    item.newitemglowAnim.Play();

            break;
          }
        }
      }
    }
  }
};

f.Show();

f.RegisterEvent('MERCHANT_SHOW');
f.RegisterEvent('MODIFIER_STATE_CHANGED');

const onEvent = function(this: typeof f, event: string, ...args: Vararg<any>) {
  return this[event](event, ...args);
};

f.SetScript('OnEvent', onEvent);


function SetGameToolTipPrice(tt: WoWAPI.GameTooltip) {
  if (!MerchantFrame.IsShown()) {
    const [, itemLink] = tt.GetItem();
    if (itemLink) {
      const [, , , , , , , , , , itemSellPrice] = GetItemInfo(itemLink);
      if (itemSellPrice && itemSellPrice > 0) {
        const container = GetMouseFocus();
        const object = container.GetObjectType();
        let count: number;
        if (object === 'Button') {
          count = container.count;
        } else if (object === 'CheckButton') {
          count = container.count || tonumber(container.Count.GetText());
        }
        const cost = (typeof count === 'number' && count || 1) * itemSellPrice;

        SetTooltipMoney(tt, cost, null, SELL_PRICE_TEXT);
      }
    }
  }
}


function SetItemRefToolTipPrice(tt: any) {
  const [, itemLink] = tt.GetItem();
  if (itemLink) {
    const [, , , , , , , , , , itemSellPrice] = GetItemInfo(itemLink);
    if (itemSellPrice && itemSellPrice > 0) {
      SetTooltipMoney(tt, itemSellPrice, null, SELL_PRICE_TEXT);
    }
  }
}


GameTooltip.HookScript('OnTooltipSetItem', SetGameToolTipPrice)
ItemRefTooltip.HookScript('OnTooltipSetItem', SetItemRefToolTipPrice)
